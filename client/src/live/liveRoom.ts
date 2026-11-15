/**
 * VedaLearn live class engine (browser side). No React in here, so the same file is used by the admin panel (host)
 * and by the student website. Audio / video travel by WebRTC straight between browsers:
 *
 *      host  <--- audio + video --->  student 1
 *       |    <--- audio + video --->  student 2          (the host is the centre of the star;
 *       ...                                              the server only passes the handshakes along)
 *
 * - Every peer connection has two sendrecv transceivers (audio + video) created once, so switching a camera / mic /
 *   screen on or off is a replaceTrack() and never needs a new negotiation.
 * - The host mixes the audio of everybody who is allowed to speak and sends each student "everything except their own voice".
 * - The host lowers video quality automatically as more students join (sending to 30 people costs 30x the upload).
 */
import { io, type Socket } from 'socket.io-client';

export interface LiveFeatures {
  chat: boolean;
  handRaise: boolean;
  polls: boolean;
  reactions: boolean;
  studentCamera: boolean;
  recording: boolean;
}
export interface RoomState {
  hostPresent: boolean;
  locked: boolean;
  chatEnabled: boolean;
  recording: boolean;
  students: number;
  maxStudents: number;
  features: LiveFeatures;
  poll: PollState | null;
}
export interface PollState {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  total: number;
  open: boolean;
}
export interface Participant {
  id: string;
  name: string;
  handRaised: boolean;
  perm: { mic: boolean; cam: boolean };
  media: { mic: boolean; cam: boolean };
  joinedAt: number;
}
export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  role: 'host' | 'student';
  text: string;
  at: string;
}
export type Role = 'host' | 'student';
export type ConnQuality = 'connecting' | 'good' | 'poor' | 'failed';

export interface RecordingUploader {
  start: () => Promise<{ recordingId: string }>;
  chunk: (recordingId: string, blob: Blob) => Promise<void>;
  finish: (recordingId: string, durationSec: number) => Promise<void>;
}

interface JoinReply {
  ok: boolean;
  message?: string;
  code?: number;
  full?: boolean;
  role?: Role;
  me?: { id: string; name: string };
  iceServers?: RTCIceServer[];
  title?: string;
  state?: RoomState;
  participants?: Participant[];
  messages?: ChatMessage[];
}
type Ack = { ok: boolean; message?: string; [k: string]: unknown };

type Handler = (payload: never) => void;

// ------------------------------------------------------------------------------------------------
// audio mixer (host only)
// ------------------------------------------------------------------------------------------------
class AudioMixer {
  readonly ctx = new AudioContext();
  private hostBus = this.ctx.createGain();
  private monitor = this.ctx.createGain();
  private recordDest = this.ctx.createMediaStreamDestination();
  private students = new Map<string, { gain: GainNode; el: HTMLAudioElement }>();
  private outs = new Map<string, MediaStreamAudioDestinationNode>();
  private micSource: MediaStreamAudioSourceNode | null = null;
  private screenSource: MediaStreamAudioSourceNode | null = null;

  constructor() {
    this.hostBus.connect(this.recordDest);
    this.monitor.connect(this.ctx.destination);
  }

  get recordingStream(): MediaStream {
    return this.recordDest.stream;
  }

  resume() {
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMic(track: MediaStreamTrack | null) {
    this.micSource?.disconnect();
    this.micSource = track ? this.ctx.createMediaStreamSource(new MediaStream([track])) : null;
    this.micSource?.connect(this.hostBus);
  }

  setScreenAudio(track: MediaStreamTrack | null) {
    this.screenSource?.disconnect();
    this.screenSource = track ? this.ctx.createMediaStreamSource(new MediaStream([track])) : null;
    this.screenSource?.connect(this.hostBus);
  }

  /** the track that goes to one student: host + every other student */
  addOut(id: string): MediaStreamTrack {
    const dest = this.ctx.createMediaStreamDestination();
    this.hostBus.connect(dest);
    this.students.forEach((s, other) => {
      if (other !== id) s.gain.connect(dest);
    });
    this.outs.set(id, dest);
    return dest.stream.getAudioTracks()[0];
  }

  removeOut(id: string) {
    this.outs.get(id)?.disconnect();
    this.outs.delete(id);
  }

  addStudent(id: string, stream: MediaStream) {
    this.removeStudent(id);
    // Chromium only delivers a remote stream to WebAudio when it is also attached to a (muted) media element
    const el = new Audio();
    el.muted = true;
    el.srcObject = stream;
    void el.play().catch(() => {});

    const source = this.ctx.createMediaStreamSource(stream);
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(this.monitor);
    gain.connect(this.recordDest);
    this.outs.forEach((dest, other) => {
      if (other !== id) gain.connect(dest);
    });
    this.students.set(id, { gain, el });
  }

  removeStudent(id: string) {
    const s = this.students.get(id);
    if (!s) return;
    s.gain.disconnect();
    s.el.srcObject = null;
    this.students.delete(id);
  }

  setMonitorVolume(v: number) {
    this.monitor.gain.value = v;
  }

  close() {
    this.students.forEach((_s, id) => this.removeStudent(id));
    void this.ctx.close().catch(() => {});
  }
}

// ------------------------------------------------------------------------------------------------
// the room
// ------------------------------------------------------------------------------------------------
export interface LiveRoomOptions {
  serverUrl: string; // origin of the API, e.g. http://localhost:5000
  token: string;
  classId: string;
  role: Role;
}

/** bitrate (kbit/s) and downscale for the host's picture, by how many students are connected */
/** screen share: sharper than a camera, but fewer pixels so the frame rate stays high (smooth scrolling / slide changes) */
const screenQualityFor = (students: number): { kbps: number; scale: number } => {
  if (students <= 5) return { kbps: 2200, scale: 1 };
  if (students <= 15) return { kbps: 1400, scale: 1.5 };
  if (students <= 30) return { kbps: 900, scale: 2 };
  if (students <= 60) return { kbps: 550, scale: 2.5 };
  return { kbps: 350, scale: 3 };
};

const qualityFor = (students: number): { kbps: number; scale: number } => {
  if (students <= 5) return { kbps: 1500, scale: 1 };
  if (students <= 15) return { kbps: 900, scale: 1 };
  if (students <= 30) return { kbps: 550, scale: 1.5 };
  if (students <= 60) return { kbps: 350, scale: 2 };
  return { kbps: 220, scale: 3 };
};

export class LiveRoomClient {
  readonly role: Role;
  me: { id: string; name: string } = { id: '', name: '' };
  state: RoomState | null = null;
  participants: Participant[] = [];

  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Handler>>();
  private ice: RTCIceServer[] = [];
  private closed = false;

  // host side
  private mixer: AudioMixer | null = null;
  private peers = new Map<string, { pc: RTCPeerConnection; audio: RTCRtpSender; video: RTCRtpSender; quality: ConnQuality; pending: RTCIceCandidateInit[] }>();
  private camTrack: MediaStreamTrack | null = null;
  private micTrack: MediaStreamTrack | null = null;
  private screenStream: MediaStream | null = null;
  private qualityTimer = 0;
  private recorder: { rec: MediaRecorder; stop: () => Promise<void> } | null = null;

  // student side
  private hostPc: RTCPeerConnection | null = null;
  private hostSenders: { audio?: RTCRtpSender; video?: RTCRtpSender } = {};
  private hostPending: RTCIceCandidateInit[] = [];
  private remote = new MediaStream();
  private myMic: MediaStreamTrack | null = null;
  private myCam: MediaStreamTrack | null = null;
  perm = { mic: false, cam: false };

  constructor(private opts: LiveRoomOptions) {
    this.role = opts.role;
  }

  // ---------------- tiny event emitter ----------------
  on<T = unknown>(event: string, fn: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Handler);
    return () => this.listeners.get(event)?.delete(fn as Handler);
  }
  private emit(event: string, payload?: unknown) {
    this.listeners.get(event)?.forEach((fn) => (fn as (p: unknown) => void)(payload));
  }

  // ---------------- connect ----------------
  /** Opens the connection and enters the room. Rejects with a readable message (full, locked, not allowed, ...). */
  connect(): Promise<JoinReply> {
    return new Promise((resolve, reject) => {
      const socket = io(`${this.opts.serverUrl}/live`, { auth: { token: this.opts.token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionDelayMax: 4000 });
      this.socket = socket;
      let joined = false;

      const join = () => {
        socket.emit('join', { classId: this.opts.classId }, (reply: JoinReply) => {
          if (!reply?.ok) {
            const err = Object.assign(new Error(reply?.message ?? 'Could not join the class'), { code: reply?.code, full: reply?.full });
            if (!joined) {
              this.close();
              return reject(err);
            }
            this.emit('error', err.message);
            return undefined;
          }
          this.me = reply.me!;
          this.ice = reply.iceServers ?? [];
          this.state = reply.state ?? null;
          this.participants = reply.participants ?? [];
          if (this.role === 'host' && !this.mixer) this.mixer = new AudioMixer();
          if (joined) this.emit('reconnected');
          joined = true;
          return resolve(reply);
        });
      };

      socket.on('connect', join);
      socket.on('connect_error', (err) => {
        if (!joined) {
          this.close();
          reject(new Error(err.message || 'Cannot reach the live class server'));
        }
      });
      socket.on('disconnect', (reason) => {
        if (this.closed) return;
        this.emit('disconnected', reason);
      });

      socket.on('room:state', (s: RoomState) => {
        this.state = s;
        this.emit('state', s);
      });
      socket.on('participants', (list: Participant[]) => {
        this.participants = list;
        this.emit('participants', list);
      });
      socket.on('chat:message', (m: ChatMessage) => this.emit('chat', m));
      socket.on('reaction', (r: { emoji: string; name: string }) => this.emit('reaction', r));
      socket.on('poll:update', (p: PollState) => this.emit('poll', p));
      socket.on('class:ended', () => {
        this.emit('ended');
        this.teardown();
      });
      socket.on('kicked', () => {
        this.emit('kicked');
        this.close();
      });
      socket.on('replaced', () => {
        this.emit('replaced');
        this.close();
      });
      socket.on('signal', (m: { from: string; data: SignalData }) => void this.onSignal(m).catch((e) => console.warn('[live] signal', e)));

      if (this.role === 'host') {
        socket.on('peer:joined', (p: { id: string; name: string }) => void this.hostAddPeer(p.id).catch((e) => console.warn('[live] offer', e)));
        socket.on('peer:left', (p: { id: string }) => this.hostRemovePeer(p.id));
      } else {
        socket.on('host:left', () => this.emit('hostLeft'));
        socket.on('host:present', () => this.emit('hostBack'));
        socket.on('perm', (p: { mic: boolean; cam: boolean }) => this.onPerm(p));
        socket.on('hand:lowered', () => this.emit('handLowered'));
      }
    });
  }

  private send(event: string, payload: object = {}): Promise<Ack> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) return resolve({ ok: false, message: 'You are offline. Reconnecting…' });
      return this.socket.timeout(8000).emit(event, payload, (err: Error | null, reply: Ack) => resolve(err ? { ok: false, message: 'The server did not answer' } : reply));
    });
  }

  private async onSignal(m: { from: string; data: SignalData }) {
    const { data } = m;
    if (this.role === 'host') {
      const peer = this.peers.get(m.from);
      if (!peer) return;
      if (data.sdp) {
        await peer.pc.setRemoteDescription(data.sdp);
        for (const c of peer.pending.splice(0)) await peer.pc.addIceCandidate(c).catch(() => {});
      } else if (data.candidate) {
        if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(data.candidate).catch(() => {});
        else peer.pending.push(data.candidate);
      }
      return;
    }
    await this.studentSignal(data);
  }

  // ==============================================================================================
  // HOST
  // ==============================================================================================
  /** asks for camera + microphone; each may fail separately (a host without a camera can still teach) */
  async startMedia(opts: { video?: boolean; audio?: boolean; deviceId?: { video?: string; audio?: string } } = {}): Promise<{ video: boolean; audio: boolean; error?: string }> {
    this.mixer?.resume();
    const want = { video: opts.video ?? true, audio: opts.audio ?? true };
    let video = false;
    let audio = false;
    let error = '';
    if (want.video) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 }, deviceId: opts.deviceId?.video ? { exact: opts.deviceId.video } : undefined },
        });
        this.camTrack?.stop();
        this.camTrack = s.getVideoTracks()[0];
        this.camTrack.contentHint = 'motion';
        video = true;
      } catch (e) {
        error = mediaError(e, 'camera');
      }
    }
    if (want.audio) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, deviceId: opts.deviceId?.audio ? { exact: opts.deviceId.audio } : undefined },
        });
        this.micTrack?.stop();
        this.micTrack = s.getAudioTracks()[0];
        this.mixer?.setMic(this.micTrack);
        audio = true;
      } catch (e) {
        error = error || mediaError(e, 'microphone');
      }
    }
    this.pushHostVideo();
    this.emit('localStream', this.localStream);
    return { video, audio, error: error || undefined };
  }

  /** what the host sees of themselves */
  get localStream(): MediaStream | null {
    const track = this.screenStream?.getVideoTracks()[0] ?? this.camTrack;
    return track ? new MediaStream([track]) : null;
  }
  get screenSharing() {
    return Boolean(this.screenStream);
  }
  get camOn() {
    return Boolean(this.camTrack?.enabled);
  }
  get micOn() {
    return Boolean(this.micTrack?.enabled);
  }

  setCamEnabled(on: boolean) {
    if (this.camTrack) this.camTrack.enabled = on;
    this.pushHostVideo();
    this.emit('localStream', this.localStream);
  }
  setMicEnabled(on: boolean) {
    if (this.micTrack) this.micTrack.enabled = on;
  }

  async shareScreen(): Promise<void> {
    if (this.screenStream) return;
    // 1280x720 at 15 fps: text stays readable and the browser can keep up in real time (full HD would lag on most connections)
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { width: { max: 1920 }, height: { max: 1080 }, frameRate: { ideal: 15, max: 20 } }, audio: true });
    this.screenStream = stream;
    const v = stream.getVideoTracks()[0];
    v.contentHint = 'text'; // sharp text, but never at the cost of a frozen picture (see degradationPreference below)
    v.addEventListener('ended', () => this.stopScreen());
    this.mixer?.setScreenAudio(stream.getAudioTracks()[0] ?? null);
    this.pushHostVideo();
    this.applyQuality();
    this.emit('localStream', this.localStream);
    this.emit('screen', true);
  }
  stopScreen() {
    if (!this.screenStream) return;
    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = null;
    this.mixer?.setScreenAudio(null);
    this.pushHostVideo();
    this.emit('localStream', this.localStream);
    this.emit('screen', false);
  }

  /** the video that students get: screen > camera (when on) > nothing */
  private hostVideoTrack(): MediaStreamTrack | null {
    if (this.screenStream) return this.screenStream.getVideoTracks()[0];
    return this.camTrack?.enabled ? this.camTrack : null;
  }
  private pushHostVideo() {
    const track = this.hostVideoTrack();
    this.peers.forEach((p) => void p.video.replaceTrack(track).catch(() => {}));
  }

  private async hostAddPeer(id: string) {
    if (this.peers.has(id)) this.hostRemovePeer(id);
    const mixer = this.mixer!;
    mixer.resume();

    const pc = new RTCPeerConnection({ iceServers: this.ice });
    const audio = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const video = pc.addTransceiver('video', { direction: 'sendrecv' });
    await audio.sender.replaceTrack(mixer.addOut(id));
    await video.sender.replaceTrack(this.hostVideoTrack());

    const peer = { pc, audio: audio.sender, video: video.sender, quality: 'connecting' as ConnQuality, pending: [] as RTCIceCandidateInit[] };
    this.peers.set(id, peer);

    pc.onicecandidate = (e) => e.candidate && this.socket?.emit('signal', { to: id, data: { candidate: e.candidate.toJSON() } });
    pc.ontrack = (e) => {
      const stream = new MediaStream([e.track]);
      if (e.track.kind === 'audio') mixer.addStudent(id, stream);
      else this.emit('studentVideo', { id, stream });
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      peer.quality = s === 'connected' ? 'good' : s === 'failed' ? 'failed' : s === 'disconnected' ? 'poor' : 'connecting';
      this.emit('peerState', { id, state: peer.quality });
      if (s === 'failed' && this.peers.get(id) === peer) void this.offer(id, true).catch(() => {});
    };

    await this.offer(id, false);
    this.applyQuality();
  }

  private async offer(id: string, restart: boolean) {
    const peer = this.peers.get(id);
    if (!peer) return;
    const offer = await peer.pc.createOffer(restart ? { iceRestart: true } : undefined);
    await peer.pc.setLocalDescription(offer);
    this.socket?.emit('signal', { to: id, data: { sdp: peer.pc.localDescription!.toJSON(), restart } });
  }

  private hostRemovePeer(id: string) {
    const peer = this.peers.get(id);
    if (!peer) return;
    peer.pc.close();
    this.peers.delete(id);
    this.mixer?.removeOut(id);
    this.mixer?.removeStudent(id);
    this.emit('studentVideoGone', { id });
    this.applyQuality();
  }

  /** lowers / raises the picture quality for everybody when the number of students changes */
  private applyQuality() {
    window.clearTimeout(this.qualityTimer);
    this.qualityTimer = window.setTimeout(() => {
      const sharing = Boolean(this.screenStream);
      const { kbps, scale } = sharing ? screenQualityFor(this.peers.size) : qualityFor(this.peers.size);
      this.peers.forEach((p) => {
        const params = p.video.getParameters() as RTCRtpSendParameters & { degradationPreference?: string };
        if (!params.encodings?.length) params.encodings = [{}];
        params.encodings[0].maxBitrate = kbps * 1000;
        params.encodings[0].scaleResolutionDownBy = scale;
        params.encodings[0].maxFramerate = sharing ? 15 : 30;
        params.degradationPreference = 'maintain-framerate'; // when the network is slow lower the sharpness, not the speed
        void p.video.setParameters(params).catch(() => {});
        const a = p.audio.getParameters();
        if (a.encodings?.length) {
          a.encodings[0].maxBitrate = 40000;
          void p.audio.setParameters(a).catch(() => {});
        }
      });
      this.emit('quality', { students: this.peers.size, kbps });
    }, 400);
  }

  peerStates(): Record<string, ConnQuality> {
    const out: Record<string, ConnQuality> = {};
    this.peers.forEach((p, id) => (out[id] = p.quality));
    return out;
  }

  // ---------------- host controls ----------------
  setPerm(userId: string, perm: { mic?: boolean; cam?: boolean }) {
    return this.send('host:perm', { userId, ...perm });
  }
  muteAll() {
    return this.send('host:muteAll');
  }
  lowerHands() {
    return this.send('host:lowerHands');
  }
  kick(userId: string) {
    return this.send('host:kick', { userId });
  }
  setLocked(locked: boolean) {
    return this.send('host:lock', { locked });
  }
  setChatEnabled(enabled: boolean) {
    return this.send('host:chat', { enabled });
  }
  startPoll(question: string, options: string[]) {
    return this.send('host:poll:start', { question, options });
  }
  endPoll() {
    return this.send('host:poll:end');
  }
  endClass() {
    return this.send('host:end');
  }
  setMonitorVolume(v: number) {
    this.mixer?.setMonitorVolume(v);
  }

  // ---------------- recording (host) ----------------
  get recording() {
    return Boolean(this.recorder);
  }

  /** records what students see (host picture + mixed audio of the whole class) and uploads it in 5 second pieces */
  async startRecording(uploader: RecordingUploader, canvasEl?: HTMLCanvasElement): Promise<void> {
    if (this.recorder || !this.mixer) return;
    const { recordingId } = await uploader.start();

    const canvas = canvasEl ?? document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const g = canvas.getContext('2d')!;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    let raf = 0;
    const draw = () => {
      const track = this.hostVideoTrack();
      if (track && video.srcObject !== this.currentRecordSrc(track)) {
        video.srcObject = this.currentRecordSrc(track);
        void video.play().catch(() => {});
      }
      g.fillStyle = '#2a1608';
      g.fillRect(0, 0, 1280, 720);
      if (track && video.videoWidth) {
        const r = Math.min(1280 / video.videoWidth, 720 / video.videoHeight);
        const w = video.videoWidth * r;
        const h = video.videoHeight * r;
        g.drawImage(video, (1280 - w) / 2, (720 - h) / 2, w, h);
      } else {
        g.fillStyle = '#e3c285';
        g.font = '600 38px sans-serif';
        g.textAlign = 'center';
        g.fillText('VedaLearn Live', 640, 370);
      }
      raf = window.setTimeout(draw, 1000 / 24) as unknown as number; // setTimeout keeps running in a background tab, requestAnimationFrame does not
    };
    draw();

    const stream = new MediaStream([...canvas.captureStream(24).getVideoTracks(), ...this.mixer.recordingStream.getAudioTracks()]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_800_000, audioBitsPerSecond: 96_000 });
    const startedAt = Date.now();
    let queue: Promise<void> = Promise.resolve();
    let failed = '';
    rec.ondataavailable = (e) => {
      if (!e.data.size) return;
      queue = queue.then(() => uploader.chunk(recordingId, e.data)).catch((err: Error) => {
        failed = err.message;
        this.emit('recordingError', err.message);
      });
    };
    rec.start(5000);

    const stop = async () => {
      window.clearTimeout(raf);
      await new Promise<void>((done) => {
        rec.onstop = () => done();
        if (rec.state !== 'inactive') rec.stop();
        else done();
      });
      await queue;
      stream.getTracks().forEach((t) => t.stop());
      if (!failed) await uploader.finish(recordingId, Math.round((Date.now() - startedAt) / 1000));
    };
    this.recorder = { rec, stop };
    const res = await this.send('host:recording', { on: true });
    if (!res.ok) {
      await this.stopRecording().catch(() => {});
      throw new Error(res.message ?? 'Could not start recording');
    }
    this.emit('recording', true);
  }
  private recordSrc: { track: MediaStreamTrack; stream: MediaStream } | null = null;
  private currentRecordSrc(track: MediaStreamTrack) {
    if (this.recordSrc?.track !== track) this.recordSrc = { track, stream: new MediaStream([track]) };
    return this.recordSrc.stream;
  }

  async stopRecording(): Promise<void> {
    const r = this.recorder;
    if (!r) return;
    this.recorder = null;
    void this.send('host:recording', { on: false });
    this.emit('recording', false);
    await r.stop();
  }

  // ==============================================================================================
  // STUDENT
  // ==============================================================================================
  get hostStream(): MediaStream {
    return this.remote;
  }

  private async studentSignal(data: SignalData) {
    if (data.sdp) {
      if (data.sdp.type !== 'offer') return;
      if (!data.restart || !this.hostPc) this.newHostConnection();
      const pc = this.hostPc!;
      await pc.setRemoteDescription(data.sdp);
      // the offered transceivers arrive as receive-only: turn them into send+receive so the mic / camera can be used later
      pc.getTransceivers().forEach((t) => {
        t.direction = 'sendrecv';
        if (t.receiver.track.kind === 'audio') this.hostSenders.audio = t.sender;
        else this.hostSenders.video = t.sender;
      });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket?.emit('signal', { data: { sdp: pc.localDescription!.toJSON() } });
      for (const c of this.hostPending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
      void this.hostSenders.audio?.replaceTrack(this.perm.mic ? this.myMic : null).catch(() => {});
      void this.hostSenders.video?.replaceTrack(this.perm.cam ? this.myCam : null).catch(() => {});
    } else if (data.candidate) {
      if (this.hostPc?.remoteDescription) await this.hostPc.addIceCandidate(data.candidate).catch(() => {});
      else this.hostPending.push(data.candidate);
    }
  }

  private newHostConnection() {
    this.hostPc?.close();
    this.remote = new MediaStream();
    this.hostPending = [];
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    this.hostPc = pc;
    pc.onicecandidate = (e) => e.candidate && this.socket?.emit('signal', { data: { candidate: e.candidate.toJSON() } });
    pc.ontrack = (e) => {
      this.remote.addTrack(e.track);
      e.track.onunmute = () => this.emit('hostMedia');
      e.track.onmute = () => this.emit('hostMedia');
      this.emit('hostStream', this.remote);
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      this.emit('hostConn', s === 'connected' ? 'good' : s === 'failed' ? 'failed' : s === 'disconnected' ? 'poor' : 'connecting');
    };
  }

  private onPerm(p: { mic: boolean; cam: boolean }) {
    this.perm = p;
    if (!p.mic) this.stopMyTrack('mic');
    if (!p.cam) this.stopMyTrack('cam');
    this.emit('perm', p);
  }

  private stopMyTrack(kind: 'mic' | 'cam') {
    const track = kind === 'mic' ? this.myMic : this.myCam;
    track?.stop();
    if (kind === 'mic') this.myMic = null;
    else this.myCam = null;
    void (kind === 'mic' ? this.hostSenders.audio : this.hostSenders.video)?.replaceTrack(null).catch(() => {});
    this.pushMediaState();
  }

  /** turns the student's own mic on / off (only works after the host allowed it) */
  async setMyMic(on: boolean): Promise<string | undefined> {
    if (!on) return void this.stopMyTrack('mic');
    if (!this.perm.mic) return 'The host has not allowed your microphone';
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      this.myMic?.stop();
      this.myMic = s.getAudioTracks()[0];
      await this.hostSenders.audio?.replaceTrack(this.myMic);
      this.pushMediaState();
      return undefined;
    } catch (e) {
      return mediaError(e, 'microphone');
    }
  }
  async setMyCam(on: boolean): Promise<string | undefined> {
    if (!on) return void this.stopMyTrack('cam');
    if (!this.perm.cam) return 'The host has not allowed your camera';
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 20, max: 24 } } });
      this.myCam?.stop();
      this.myCam = s.getVideoTracks()[0];
      await this.hostSenders.video?.replaceTrack(this.myCam);
      const sender = this.hostSenders.video;
      if (sender) {
        const params = sender.getParameters();
        if (!params.encodings?.length) params.encodings = [{}];
        params.encodings[0].maxBitrate = 250_000;
        void sender.setParameters(params).catch(() => {});
      }
      this.pushMediaState();
      return undefined;
    } catch (e) {
      return mediaError(e, 'camera');
    }
  }
  get myCamStream(): MediaStream | null {
    return this.myCam ? new MediaStream([this.myCam]) : null;
  }
  get micLive() {
    return Boolean(this.myMic);
  }
  get camLive() {
    return Boolean(this.myCam);
  }
  private pushMediaState() {
    this.socket?.emit('media:state', { mic: Boolean(this.myMic), cam: Boolean(this.myCam) });
    this.emit('myMedia', { mic: Boolean(this.myMic), cam: Boolean(this.myCam) });
  }

  raiseHand(raised: boolean) {
    return this.send('hand:toggle', { raised });
  }
  vote(pollId: string, option: number) {
    return this.send('poll:vote', { pollId, option });
  }

  // ---------------- both ----------------
  sendChat(text: string) {
    return this.send('chat:send', { text });
  }
  sendReaction(emoji: string) {
    this.socket?.emit('reaction:send', { emoji });
  }

  private teardown() {
    window.clearTimeout(this.qualityTimer);
    void this.stopRecording().catch(() => {});
    this.peers.forEach((p) => p.pc.close());
    this.peers.clear();
    this.hostPc?.close();
    this.hostPc = null;
    [this.camTrack, this.micTrack, this.myCam, this.myMic].forEach((t) => t?.stop());
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.screenStream = null;
    this.camTrack = this.micTrack = this.myCam = this.myMic = null;
    this.mixer?.close();
    this.mixer = null;
  }

  /** leaves the room and releases camera / microphone */
  close() {
    if (this.closed) return;
    this.closed = true;
    this.teardown();
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }
}

interface SignalData {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  restart?: boolean;
}

function mediaError(e: unknown, what: string): string {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return `Allow the ${what} in your browser (lock icon next to the address) and try again`;
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return `No ${what} found on this device`;
  if (name === 'NotReadableError') return `The ${what} is being used by another app`;
  return `Could not start the ${what}`;
}