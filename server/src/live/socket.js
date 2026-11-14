const crypto = require('crypto');
const { Server } = require('socket.io');
const { env } = require('../config/env');
const authService = require('../services/auth.service');
const liveService = require('../services/liveClass.service');
const { rooms } = require('./rooms');

/**
 * Signalling server of the live classes (Socket.IO, namespace /live).
 *
 * It never touches audio / video: it only introduces browsers to each other and relays WebRTC offers / answers.
 *   host browser  <==== WebRTC (video + audio) ====>  every student browser      (star shape: the host is the centre)
 * Chat, raised hands, polls, mic permissions, locking, kicking ... all go through here so the host stays in control.
 */

const HOST_GRACE_MS = 10 * 60 * 1000; // the class is ended when the host stays away this long
const EMOJIS = ['👏', '🙏', '❤️', '👍', '😊', '🔥'];
const MAX_CHAT = 500;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v) => v === true;

// ------------------------------------------------------------------------------------------------
// room helpers
// ------------------------------------------------------------------------------------------------
const createRoom = (cls) => ({
  id: String(cls._id),
  title: cls.title,
  maxStudents: cls.maxStudents,
  features: { ...(cls.features?.toObject ? cls.features.toObject() : cls.features) },
  host: null, // { userId, name, socketId }
  students: new Map(), // userId -> { id, name, socketId, handRaised, perm:{mic,cam}, media:{mic,cam}, joinedAt }
  banned: new Set(),
  locked: false,
  chatEnabled: cls.features?.chat !== false,
  recording: false,
  poll: null, // the running or last poll
  closedPolls: [],
  recent: [], // last 100 chat messages (sent to people who join late)
  pending: [], // chat messages not saved yet
  peak: 0,
  graceTimer: null,
  flushTimer: null,
  pollTimer: null,
});

const participantsOf = (room) =>
  [...room.students.values()].map((s) => ({ id: s.id, name: s.name, handRaised: s.handRaised, perm: s.perm, media: s.media, joinedAt: s.joinedAt }));

const publicPoll = (poll) => {
  if (!poll) return null;
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
  return { id: poll.id, question: poll.question, options: poll.options.map((o) => ({ text: o.text, votes: o.votes })), total, open: poll.open };
};

const stateOf = (room) => ({
  hostPresent: Boolean(room.host),
  locked: room.locked,
  chatEnabled: room.chatEnabled,
  recording: room.recording,
  students: room.students.size,
  maxStudents: room.maxStudents,
  features: room.features,
  poll: publicPoll(room.poll),
});

module.exports.initLiveSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
    maxHttpBufferSize: 256 * 1024, // signalling messages are tiny; refuse anything big
    pingInterval: 10000,
    pingTimeout: 15000,
  });
  const nsp = io.of('/live');

  const emitRoom = (room, event, payload) => nsp.to(`room:${room.id}`).emit(event, payload);
  const emitHost = (room, event, payload) => room.host && nsp.to(room.host.socketId).emit(event, payload);
  const emitStudent = (room, userId, event, payload) => {
    const s = room.students.get(userId);
    if (s) nsp.to(s.socketId).emit(event, payload);
  };
  const pushState = (room) => emitRoom(room, 'room:state', stateOf(room));
  const pushParticipants = (room) => emitHost(room, 'participants', participantsOf(room));

  const flushMessages = (room) => {
    if (room.pending.length === 0) return;
    const batch = room.pending.splice(0);
    Promise.resolve(liveService.saveMessages(room.id, batch)).catch((err) => console.warn('[live] could not save chat:', err.message));
  };

  const closeRoom = (room) => {
    clearTimeout(room.graceTimer);
    clearTimeout(room.pollTimer);
    clearInterval(room.flushTimer);
    rooms.delete(room.id);
  };

  /** a student leaves (closed the tab, was removed, was replaced by a newer connection) */
  const removeStudent = (room, userId, expectSocketId) => {
    const s = room.students.get(userId);
    if (!s || (expectSocketId && s.socketId !== expectSocketId)) return;
    room.students.delete(userId);
    Promise.resolve(liveService.recordLeave(room.id, userId, (Date.now() - s.joinedAt) / 1000)).catch(() => {});
    emitHost(room, 'peer:left', { id: userId });
    pushParticipants(room);
    pushState(room);
    // nobody left and the host never came: forget the room (it is created again when the next student arrives)
    if (!room.host && room.students.size === 0) {
      flushMessages(room);
      closeRoom(room);
    }
  };

  const endClass = async (room) => {
    if (rooms.get(room.id) !== room) return;
    closeRoom(room);
    flushMessages(room);
    if (room.poll) room.closedPolls.push(room.poll);

    const students = [...room.students.values()];
    room.students.clear();
    nsp.to(`room:${room.id}`).emit('class:ended');

    const now = Date.now();
    await Promise.allSettled([
      ...students.map((s) => liveService.recordLeave(room.id, s.id, (now - s.joinedAt) / 1000)),
      liveService.savePolls(
        room.id,
        room.closedPolls.map((p) => ({ question: p.question, options: p.options.map((o) => ({ text: o.text, votes: o.votes })), total: p.options.reduce((n, o) => n + o.votes, 0), at: new Date(p.startedAt) })),
      ),
      liveService.markEnded(room.id, { peak: room.peak }),
    ]);

    // let the "class ended" message arrive, then drop everybody
    setTimeout(() => nsp.in(`room:${room.id}`).disconnectSockets(true), 800).unref();
  };

  // ----------------------------------------------------------------------------------------------
  // connection
  // ----------------------------------------------------------------------------------------------
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || !token) return next(new Error('Please sign in to join the class'));
      const user = await authService.getUserFromToken(token);
      if (user.mustChangePassword) return next(new Error('Please change your temporary password first'));
      socket.data.user = user;
      return next();
    } catch (err) {
      return next(new Error(err.message || 'Please sign in again'));
    }
  });

  nsp.on('connection', (socket) => {
    const user = socket.data.user;
    const me = { id: String(user._id), name: user.name };
    let ctx = null; // { room, role } once joined

    /** every handler is wrapped so that one bad message can never crash the server */
    const on = (event, handler) =>
      socket.on(event, async (payload, ack) => {
        const reply = typeof ack === 'function' ? ack : () => {};
        try {
          await handler(payload && typeof payload === 'object' ? payload : {}, reply);
        } catch (err) {
          console.warn(`[live] ${event} failed:`, err.message);
          reply({ ok: false, message: 'Something went wrong' });
        }
      });

    const hostOnly = (reply) => {
      if (ctx?.role === 'host') return true;
      reply({ ok: false, message: 'Only the host can do this' });
      return false;
    };

    // ---------------- join ----------------
    on('join', async (payload, reply) => {
      if (ctx) return reply({ ok: false, message: 'You are already in the class' });
      const classId = str(payload.classId, 40);

      let auth;
      try {
        auth = await liveService.authorizeJoin(user, classId);
      } catch (err) {
        return reply({ ok: false, code: err.statusCode || 500, message: err.message });
      }
      const { cls, role } = auth;

      let room = rooms.get(String(cls._id));
      if (!room) {
        room = createRoom(cls);
        room.flushTimer = setInterval(() => flushMessages(room), 10000);
        room.flushTimer.unref();
        rooms.set(room.id, room);
      }

      if (role === 'host') {
        if (room.host && room.host.userId !== me.id) return reply({ ok: false, code: 409, message: 'Another host is already running this class' });
        if (room.host) {
          // the same person opened the room in a second tab: the new tab takes over
          nsp.to(room.host.socketId).emit('replaced');
          nsp.in(room.host.socketId).disconnectSockets(true);
        }
        clearTimeout(room.graceTimer);
        room.host = { userId: me.id, name: me.name, socketId: socket.id };
        ctx = { room, role };
        socket.join(`room:${room.id}`);
        await liveService.markLive(cls._id);

        // introduce the host to every student already waiting
        room.students.forEach((s) => socket.emit('peer:joined', { id: s.id, name: s.name }));
        emitRoom(room, 'host:present');
        pushState(room);
        return reply({
          ok: true,
          role,
          me,
          iceServers: env.live.iceServers,
          title: room.title,
          state: stateOf(room),
          participants: participantsOf(room),
          messages: room.recent,
        });
      }

      // ---- student ----
      if (room.banned.has(me.id)) return reply({ ok: false, code: 403, message: 'The host removed you from this class' });
      const existing = room.students.get(me.id);
      if (room.locked && !existing) return reply({ ok: false, code: 423, message: 'The host has locked the class. No new students can join.' });
      if (!existing && room.students.size >= room.maxStudents) {
        return reply({ ok: false, code: 409, full: true, message: `This class is full (${room.maxStudents} students).` });
      }

      if (existing) {
        // same student opened the class twice (second tab / phone): the newest connection wins
        nsp.to(existing.socketId).emit('replaced');
        const old = existing.socketId;
        removeStudent(room, me.id, old);
        nsp.in(old).disconnectSockets(true);
      }

      room.students.set(me.id, {
        id: me.id,
        name: me.name,
        socketId: socket.id,
        handRaised: false,
        perm: { mic: false, cam: false },
        media: { mic: false, cam: false },
        joinedAt: Date.now(),
      });
      room.peak = Math.max(room.peak, room.students.size);
      ctx = { room, role };
      socket.join(`room:${room.id}`);
      Promise.resolve(liveService.recordJoin(room.id, user)).catch(() => {});

      emitHost(room, 'peer:joined', { id: me.id, name: me.name });
      pushParticipants(room);
      pushState(room);
      return reply({
        ok: true,
        role,
        me,
        iceServers: env.live.iceServers,
        title: room.title,
        state: stateOf(room),
        messages: room.recent,
      });
    });

    // ---------------- WebRTC signalling (host <-> student only) ----------------
    on('signal', (payload) => {
      if (!ctx) return;
      const { room, role } = ctx;
      const data = payload.data;
      if (!data || typeof data !== 'object') return;
      if (role === 'host') {
        const s = room.students.get(str(payload.to, 40));
        if (s) nsp.to(s.socketId).emit('signal', { from: 'host', data });
      } else if (room.host) {
        nsp.to(room.host.socketId).emit('signal', { from: me.id, data });
      }
    });

    // ---------------- chat ----------------
    let lastChatAt = 0;
    let burst = 0;
    on('chat:send', (payload, reply) => {
      if (!ctx) return;
      const { room, role } = ctx;
      if (!room.chatEnabled && role !== 'host') return reply({ ok: false, message: 'The host turned chat off' });
      const text = str(payload.text, MAX_CHAT);
      if (!text) return;

      const now = Date.now();
      burst = now - lastChatAt > 4000 ? 1 : burst + 1;
      lastChatAt = now;
      if (burst > 6) return reply({ ok: false, message: 'You are sending messages too fast' });

      const message = { id: crypto.randomUUID(), userId: me.id, name: me.name, role, text, at: new Date(now).toISOString() };
      room.recent.push(message);
      if (room.recent.length > 100) room.recent.shift();
      room.pending.push({ userId: message.userId, name: message.name, role, text, at: new Date(now) });
      emitRoom(room, 'chat:message', message);
      reply({ ok: true });
    });

    // ---------------- raise hand / mic / camera ----------------
    on('hand:toggle', (payload, reply) => {
      if (ctx?.role !== 'student') return;
      const { room } = ctx;
      if (!room.features.handRaise) return reply({ ok: false, message: 'Raising hands is turned off' });
      const s = room.students.get(me.id);
      if (!s) return;
      s.handRaised = bool(payload.raised);
      pushParticipants(room);
      reply({ ok: true, raised: s.handRaised });
    });

    on('media:state', (payload) => {
      if (ctx?.role !== 'student') return;
      const { room } = ctx;
      const s = room.students.get(me.id);
      if (!s) return;
      s.media = { mic: bool(payload.mic) && s.perm.mic, cam: bool(payload.cam) && s.perm.cam };
      pushParticipants(room);
    });

    // ---------------- reactions ----------------
    let lastReactionAt = 0;
    on('reaction:send', (payload) => {
      if (!ctx) return;
      const { room } = ctx;
      const emoji = str(payload.emoji, 8);
      const now = Date.now();
      if (!room.features.reactions || !EMOJIS.includes(emoji) || now - lastReactionAt < 1200) return;
      lastReactionAt = now;
      emitRoom(room, 'reaction', { emoji, name: me.name });
    });

    // ---------------- polls ----------------
    on('poll:vote', (payload, reply) => {
      if (ctx?.role !== 'student') return;
      const { room } = ctx;
      const poll = room.poll;
      if (!poll || !poll.open || poll.id !== payload.pollId) return reply({ ok: false, message: 'This poll is closed' });
      if (poll.voted.has(me.id)) return reply({ ok: false, message: 'You already voted' });
      const index = Number(payload.option);
      if (!Number.isInteger(index) || index < 0 || index >= poll.options.length) return;

      poll.voted.set(me.id, index);
      poll.options[index].votes += 1;
      reply({ ok: true, option: index });
      // many votes arrive together: send the totals once, a moment later
      if (!room.pollTimer) {
        room.pollTimer = setTimeout(() => {
          room.pollTimer = null;
          emitRoom(room, 'poll:update', publicPoll(room.poll));
        }, 400);
      }
    });

    // ---------------- host controls ----------------
    on('host:perm', (payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      const id = str(payload.userId, 40);
      const s = room.students.get(id);
      if (!s) return reply({ ok: false, message: 'The student left' });

      if (payload.mic !== undefined) s.perm.mic = bool(payload.mic);
      if (payload.cam !== undefined) s.perm.cam = bool(payload.cam) && room.features.studentCamera;
      if (s.perm.mic) s.handRaised = false;
      if (!s.perm.mic) s.media.mic = false;
      if (!s.perm.cam) s.media.cam = false;
      emitStudent(room, id, 'perm', { mic: s.perm.mic, cam: s.perm.cam });
      emitStudent(room, id, 'hand:lowered');
      pushParticipants(room);
      reply({ ok: true });
    });

    on('host:muteAll', (_payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      room.students.forEach((s) => {
        s.perm = { mic: false, cam: false };
        s.media = { mic: false, cam: false };
        nsp.to(s.socketId).emit('perm', s.perm);
      });
      pushParticipants(room);
      reply({ ok: true });
    });

    on('host:lowerHands', (_payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      room.students.forEach((s) => {
        if (s.handRaised) {
          s.handRaised = false;
          nsp.to(s.socketId).emit('hand:lowered');
        }
      });
      pushParticipants(room);
      reply({ ok: true });
    });

    on('host:kick', (payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      const id = str(payload.userId, 40);
      const s = room.students.get(id);
      if (!s) return reply({ ok: false, message: 'The student already left' });
      room.banned.add(id);
      nsp.to(s.socketId).emit('kicked');
      removeStudent(room, id, s.socketId);
      nsp.in(s.socketId).disconnectSockets(true);
      reply({ ok: true });
    });

    on('host:lock', (payload, reply) => {
      if (!hostOnly(reply)) return;
      ctx.room.locked = bool(payload.locked);
      pushState(ctx.room);
      reply({ ok: true });
    });

    on('host:chat', (payload, reply) => {
      if (!hostOnly(reply)) return;
      ctx.room.chatEnabled = bool(payload.enabled);
      pushState(ctx.room);
      reply({ ok: true });
    });

    on('host:recording', (payload, reply) => {
      if (!hostOnly(reply)) return;
      if (!ctx.room.features.recording) return reply({ ok: false, message: 'Recording is turned off for this class' });
      ctx.room.recording = bool(payload.on);
      pushState(ctx.room);
      reply({ ok: true });
    });

    on('host:poll:start', (payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      if (!room.features.polls) return reply({ ok: false, message: 'Polls are turned off for this class' });
      const question = str(payload.question, 200);
      const options = (Array.isArray(payload.options) ? payload.options : []).map((o) => str(o, 80)).filter(Boolean).slice(0, 6);
      if (!question || options.length < 2) return reply({ ok: false, message: 'A poll needs a question and at least 2 options' });

      if (room.poll) {
        room.poll.open = false;
        room.closedPolls.push(room.poll);
      }
      room.poll = { id: crypto.randomUUID(), question, options: options.map((text) => ({ text, votes: 0 })), voted: new Map(), open: true, startedAt: Date.now() };
      pushState(room);
      emitRoom(room, 'poll:update', publicPoll(room.poll));
      reply({ ok: true });
    });

    on('host:poll:end', (_payload, reply) => {
      if (!hostOnly(reply)) return;
      const { room } = ctx;
      if (room.poll?.open) {
        room.poll.open = false;
        emitRoom(room, 'poll:update', publicPoll(room.poll));
        pushState(room);
      }
      reply({ ok: true });
    });

    on('host:end', async (_payload, reply) => {
      if (!hostOnly(reply)) return;
      reply({ ok: true });
      await endClass(ctx.room);
    });

    // ---------------- leaving ----------------
    socket.on('disconnect', () => {
      if (!ctx) return;
      const { room, role } = ctx;
      if (role === 'host') {
        if (!room.host || room.host.socketId !== socket.id) return; // replaced by a newer tab
        room.host = null;
        emitRoom(room, 'host:left');
        pushState(room);
        // a short network drop must not end the class: give the host time to come back
        room.graceTimer = setTimeout(() => endClass(room), HOST_GRACE_MS);
        room.graceTimer.unref();
      } else {
        removeStudent(room, me.id, socket.id);
      }
    });
  });

  return io;
};