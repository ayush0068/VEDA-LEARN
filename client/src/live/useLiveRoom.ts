import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveRoomClient } from './liveRoom';
import type { ChatMessage, Participant, PollState, Role, RoomState } from './liveRoom';

export type Phase = 'idle' | 'connecting' | 'in' | 'ended' | 'kicked' | 'replaced' | 'error';
export interface FloatingReaction {
  id: number;
  emoji: string;
  name: string;
  left: number;
}

/** Connects to a live class and keeps everything the screen shows (people, chat, poll, state) in React state. */
export function useLiveRoom(opts: { serverUrl: string; token: string | null; classId: string; role: Role }) {
  const clientRef = useRef<LiveRoomClient | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<{ message: string; full?: boolean; code?: number } | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [poll, setPoll] = useState<PollState | null>(null);
  const [offline, setOffline] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [client, setClient] = useState<LiveRoomClient | null>(null);
  const reactionId = useRef(0);

  const join = useCallback(async (): Promise<LiveRoomClient | null> => {
    if (!opts.token) {
      setError({ message: 'Please sign in again' });
      setPhase('error');
      return null;
    }
    clientRef.current?.close();
    const c = new LiveRoomClient({ serverUrl: opts.serverUrl, token: opts.token, classId: opts.classId, role: opts.role });
    clientRef.current = c;
    setError(null);
    setPhase('connecting');

    c.on<RoomState>('state', (s) => {
      setState(s);
      setPoll(s.poll);
    });
    c.on<Participant[]>('participants', setParticipants);
    c.on<ChatMessage>('chat', (m) => setChat((list) => [...list.slice(-199), m]));
    c.on<PollState>('poll', setPoll);
    c.on<{ emoji: string; name: string }>('reaction', (r) => {
      const id = ++reactionId.current;
      setReactions((list) => [...list.slice(-14), { id, ...r, left: 8 + Math.random() * 80 }]);
      window.setTimeout(() => setReactions((list) => list.filter((x) => x.id !== id)), 3200);
    });
    c.on('disconnected', () => setOffline(true));
    c.on('reconnected', () => {
      setOffline(false);
      setState(c.state);
      setParticipants(c.participants);
    });
    c.on('ended', () => setPhase('ended'));
    c.on('kicked', () => setPhase('kicked'));
    c.on('replaced', () => setPhase('replaced'));

    try {
      const reply = await c.connect();
      setMe(reply.me ?? null);
      setTitle(reply.title ?? '');
      setState(reply.state ?? null);
      setPoll(reply.state?.poll ?? null);
      setParticipants(reply.participants ?? []);
      setChat(reply.messages ?? []);
      setClient(c);
      setPhase('in');
      return c;
    } catch (e) {
      const err = e as Error & { full?: boolean; code?: number };
      setError({ message: err.message, full: err.full, code: err.code });
      setPhase('error');
      return null;
    }
  }, [opts.serverUrl, opts.token, opts.classId, opts.role]);

  const leave = useCallback(() => {
    clientRef.current?.close();
    clientRef.current = null;
    setClient(null);
  }, []);

  useEffect(() => () => clientRef.current?.close(), []);

  return { client, phase, error, state, participants, chat, poll, offline, reactions, me, title, join, leave, setPhase };
}