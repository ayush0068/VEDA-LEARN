import { ArrowLeft, BarChart3, Circle, Hand, Lock, LockOpen, MessageSquare, Mic, MicOff, MonitorOff, MonitorUp, PhoneOff, Smile, Square, UserX, Users, Video, VideoOff, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Spinner } from '@/components/common/ui';
import { formatSeconds } from '@/components/live/liveUtils';
import { useToast } from '@/context/ToastContext';
import { env } from '@/config/env';
import ChatPanel from '@/live/ChatPanel';
import PollPanel from '@/live/PollPanel';
import ReactionLayer, { EMOJIS } from '@/live/ReactionLayer';
import { useLiveRoom } from '@/live/useLiveRoom';
import type { ConnQuality, Participant } from '@/live/liveRoom';
import { getToken } from '@/services/api';
import { recordingUploader } from '@/services/live.service';

type Panel = 'people' | 'chat' | 'polls' | null;

/** plays a MediaStream in a <video> */
function StreamVideo({ stream, muted = true, mirror, className = '' }: { stream: MediaStream | null; muted?: boolean; mirror?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => {});
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={`${className} ${mirror ? '-scale-x-100' : ''}`} />;
}

const roundBtn = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-95 sm:h-12 sm:w-12 disabled:opacity-40';
const idle = `${roundBtn} border-white/15 bg-white/10 text-ivory hover:bg-white/20`;
const active = `${roundBtn} border-gold bg-gold/90 text-veda-bark`;
const danger = `${roundBtn} border-red-500 bg-red-600 text-white hover:bg-red-700`;

export default function LiveRoomHost() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const room = useLiveRoom({ serverUrl: new URL(env.apiUrl).origin, token: getToken(), classId: id, role: 'host' });
  const { client, phase, error, state, participants, chat, poll, offline, reactions, me, title } = room;

  const [panel, setPanel] = useState<Panel>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [studentVideos, setStudentVideos] = useState<Record<string, MediaStream>>({});
  const [peerStates, setPeerStates] = useState<Record<string, ConnQuality>>({});
  const [startedAt, setStartedAt] = useState(0);
  const [, tick] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  // timers
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!recording) return setRecSecs(0);
    const t = window.setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  // leaving the tab while teaching: ask first
  useEffect(() => {
    if (phase !== 'in') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const start = async (withMedia: boolean) => {
    const c = await room.join();
    if (!c) return;
    setStartedAt(Date.now());
    c.on<MediaStream | null>('localStream', setLocal);
    c.on<boolean>('screen', setSharing);
    c.on<boolean>('recording', setRecording);
    c.on<string>('recordingError', (m) => toast.error(`Recording problem: ${m}`));
    c.on<{ id: string; stream: MediaStream }>('studentVideo', ({ id: sid, stream }) => setStudentVideos((v) => ({ ...v, [sid]: stream })));
    c.on<{ id: string }>('studentVideoGone', ({ id: sid }) =>
      setStudentVideos((v) => {
        const { [sid]: _gone, ...rest } = v;
        return rest;
      }),
    );
    c.on<{ id: string; state: ConnQuality }>('peerState', () => setPeerStates(c.peerStates()));
    if (withMedia) {
      const res = await c.startMedia();
      setCamOn(res.video);
      setMicOn(res.audio);
      if (res.error) toast.error(res.error);
    } else {
      setCamOn(false);
      setMicOn(false);
    }
  };

  const toggleCam = async () => {
    if (!client) return;
    if (!client.camOn && !local) {
      const res = await client.startMedia({ audio: false });
      if (res.error) return toast.error(res.error);
    }
    const next = !camOn;
    client.setCamEnabled(next);
    setCamOn(next);
  };
  const toggleMic = async () => {
    if (!client) return;
    if (!client.micOn && !micOn) {
      const res = await client.startMedia({ video: false });
      if (res.error) return toast.error(res.error);
      client.setMicEnabled(true);
      return setMicOn(true);
    }
    client.setMicEnabled(!micOn);
    return setMicOn(!micOn);
  };
  const toggleShare = async () => {
    if (!client) return;
    try {
      if (sharing) client.stopScreen();
      else await client.shareScreen();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'NotAllowedError')) toast.error('Could not share the screen');
    }
  };
  const toggleRecording = async () => {
    if (!client) return;
    try {
      if (recording) {
        await client.stopRecording();
        toast.success('Recording saved. It appears on the class card.');
      } else {
        await client.startRecording(recordingUploader(id));
        toast.success('Recording started');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Recording failed');
    }
  };
  const endClass = async () => {
    if (!client) return;
    setEnding(true);
    try {
      if (client.recording) await client.stopRecording();
    } catch {
      /* the class still ends */
    }
    await client.endClass();
  };

  const cam = (p: Participant) => studentVideos[p.id];
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const hands = participants.filter((p) => p.handRaised).length;
  const talking = participants.filter((p) => p.media.mic);
  const features = state?.features;
  const full = state ? state.students >= state.maxStudents : false;
  const exit = () => {
    room.leave();
    navigate('/live-classes');
  };

  // ---------- before / after the class ----------
  if (phase === 'idle' || phase === 'connecting' || phase === 'error') {
    return (
      <Shell>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Video size={30} />
          </span>
          <h1 className="mt-5 font-display text-[1.7rem] font-bold text-ivory">Ready to start the class?</h1>
          <p className="mt-2 text-[0.9rem] text-gold-soft/80">Your camera and microphone are asked when you start. Students waiting in the room get connected to you straight away.</p>
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[0.85rem] text-red-200">{error.message}</p>}
          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button type="button" disabled={phase === 'connecting'} onClick={() => void start(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A3E14] to-saffron px-5 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60">
              {phase === 'connecting' ? <Spinner /> : <Video size={18} />} Start class with camera & mic
            </button>
            <button type="button" disabled={phase === 'connecting'} onClick={() => void start(false)} className="rounded-xl border border-white/15 px-5 py-2.5 text-[0.88rem] font-semibold text-ivory transition hover:bg-white/10 disabled:opacity-60">
              Start with camera and mic off
            </button>
            <Link to="/live-classes" className="mt-1 inline-flex items-center justify-center gap-1.5 text-[0.84rem] text-gold-soft/80 hover:text-gold">
              <ArrowLeft size={14} /> Back to live classes
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase !== 'in') {
    const msg = phase === 'ended' ? 'The class has ended' : 'This class is open in another tab';
    return (
      <Shell>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
          <h1 className="font-display text-[1.7rem] font-bold text-ivory">{msg}</h1>
          <p className="mt-2 text-[0.9rem] text-gold-soft/80">{phase === 'ended' ? 'Attendance, polls and the recording are saved on the class card.' : 'You opened the room again somewhere else, so this tab was closed.'}</p>
          <button type="button" onClick={exit} className="mt-6 rounded-xl bg-gradient-to-r from-[#7A3E14] to-saffron px-6 py-3 font-semibold text-white">
            Back to live classes
          </button>
        </div>
      </Shell>
    );
  }

  const panelTitle = panel === 'people' ? `People (${participants.length})` : panel === 'chat' ? 'Class chat' : 'Polls';

  return (
    <Shell>
      <div className="flex h-dvh flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
            <h1 className="truncate font-display text-[1.05rem] font-bold text-ivory sm:text-[1.2rem]">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[0.8rem] text-gold-soft sm:gap-3.5">
            {recording && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 font-semibold text-red-300">
                <Circle size={9} className="animate-pulse fill-current" /> REC {formatSeconds(recSecs)}
              </span>
            )}
            <span className="hidden tabular-nums sm:inline">{formatSeconds(elapsed)}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${full ? 'bg-red-600/80 text-white' : 'bg-white/10'}`} title="Students in class / maximum">
              <Users size={14} /> {state?.students ?? 0}/{state?.maxStudents}
            </span>
            {offline ? <WifiOff size={17} className="text-red-300" aria-label="Offline" /> : <Wifi size={17} className="text-ok" aria-label="Connected" />}
          </div>
        </header>

        {offline && <p className="bg-red-700/80 px-4 py-1.5 text-center text-[0.8rem] text-white">Connection lost. Reconnecting… students keep waiting for you.</p>}

        <div className="flex min-h-0 flex-1">
          {/* stage */}
          <main className="relative flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
              {local && (camOn || sharing) ? (
                <StreamVideo stream={local} mirror={!sharing} className={`h-full w-full ${sharing ? 'object-contain' : 'object-cover'}`} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gold-soft/80">
                  <Avatar name={me?.name ?? 'Teacher'} className="h-24 w-24 text-3xl" />
                  <p className="text-[0.9rem]">{camOn ? 'Starting camera…' : 'Your camera is off. Students see your name only.'}</p>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 text-[0.76rem] text-white">
                {me?.name} (You){sharing ? ' · sharing screen' : ''}
              </span>
              {!micOn && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white"><MicOff size={15} /></span>}
              <ReactionLayer items={reactions} />

              {!state?.hostPresent && null}
              {talking.length > 0 && (
                <div className="absolute left-3 top-3 max-w-[70%] rounded-lg bg-black/60 px-2.5 py-1 text-[0.76rem] text-white">
                  <Mic size={12} className="mr-1 inline text-ok" /> {talking.map((p) => p.name).join(', ')} can speak
                </div>
              )}
            </div>

            {/* students who were allowed to show their camera */}
            {participants.some((p) => p.media.cam && cam(p)) && (
              <div className="thin-scroll mt-2.5 flex gap-2 overflow-x-auto">
                {participants
                  .filter((p) => p.media.cam && cam(p))
                  .map((p) => (
                    <div key={p.id} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/50">
                      <StreamVideo stream={cam(p)} className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/60 px-1.5 text-[0.66rem] text-white">{p.name}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* controls */}
            <div className="relative mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <button type="button" onClick={() => void toggleMic()} className={micOn ? idle : danger} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'} title={micOn ? 'Mute' : 'Unmute'}>
                {micOn ? <Mic size={19} /> : <MicOff size={19} />}
              </button>
              <button type="button" onClick={() => void toggleCam()} className={camOn ? idle : danger} aria-label={camOn ? 'Turn camera off' : 'Turn camera on'} title={camOn ? 'Camera off' : 'Camera on'}>
                {camOn ? <Video size={19} /> : <VideoOff size={19} />}
              </button>
              <button type="button" onClick={() => void toggleShare()} className={sharing ? active : idle} aria-label={sharing ? 'Stop sharing screen' : 'Share screen'} title={sharing ? 'Stop sharing' : 'Share screen'}>
                {sharing ? <MonitorOff size={19} /> : <MonitorUp size={19} />}
              </button>
              {features?.recording && (
                <button type="button" onClick={() => void toggleRecording()} className={recording ? active : idle} aria-label={recording ? 'Stop recording' : 'Start recording'} title={recording ? 'Stop recording' : 'Record class'}>
                  {recording ? <Square size={17} className="fill-current" /> : <Circle size={19} className="fill-red-500 text-red-500" />}
                </button>
              )}
              {features?.reactions && (
                <div className="relative">
                  <button type="button" onClick={() => setEmojiOpen((o) => !o)} className={idle} aria-label="Reactions" title="Reactions">
                    <Smile size={19} />
                  </button>
                  {emojiOpen && (
                    <div className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-white/15 bg-veda-bark p-1.5 shadow-xl">
                      {EMOJIS.map((e) => (
                        <button key={e} type="button" onClick={() => { client?.sendReaction(e); setEmojiOpen(false); }} className="h-9 w-9 rounded-full text-xl transition hover:bg-white/10">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="mx-1 hidden h-7 w-px bg-white/15 sm:block" />
              <button type="button" onClick={() => setPanel(panel === 'people' ? null : 'people')} className={`relative ${panel === 'people' ? active : idle}`} aria-label="People" title="People">
                <Users size={19} />
                {hands > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1 text-[0.66rem] font-bold text-white">{hands}</span>}
              </button>
              {features?.chat && (
                <button type="button" onClick={() => setPanel(panel === 'chat' ? null : 'chat')} className={panel === 'chat' ? active : idle} aria-label="Chat" title="Chat">
                  <MessageSquare size={19} />
                </button>
              )}
              {features?.polls && (
                <button type="button" onClick={() => setPanel(panel === 'polls' ? null : 'polls')} className={`relative ${panel === 'polls' ? active : idle}`} aria-label="Polls" title="Polls">
                  <BarChart3 size={19} />
                  {poll?.open && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-ok" />}
                </button>
              )}
              <button type="button" onClick={() => void client?.setLocked(!state?.locked)} className={state?.locked ? active : idle} aria-label={state?.locked ? 'Unlock class' : 'Lock class'} title={state?.locked ? 'Class locked: no new students' : 'Lock class (stop new students)'}>
                {state?.locked ? <Lock size={18} /> : <LockOpen size={18} />}
              </button>
              <button type="button" onClick={() => setConfirmEnd(true)} className={`${danger} !w-auto gap-2 px-4 text-[0.85rem] font-semibold`} aria-label="End class">
                <PhoneOff size={18} /> <span className="hidden sm:inline">End class</span>
              </button>
            </div>
          </main>

          {/* side panel */}
          {panel && (
            <aside className="fixed inset-0 z-40 flex flex-col bg-veda-bark sm:static sm:z-auto sm:w-[340px] sm:shrink-0 sm:border-l sm:border-white/10 sm:bg-black/20 lg:w-[380px]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="font-display text-[1.05rem] font-bold text-ivory">{panelTitle}</h2>
                <button type="button" onClick={() => setPanel(null)} aria-label="Close panel" className="flex h-8 w-8 items-center justify-center rounded-full text-gold-soft hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                {panel === 'chat' && (
                  <div className="flex h-full flex-col">
                    <label className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-[0.8rem] text-gold-soft">
                      Let students chat
                      <input type="checkbox" checked={state?.chatEnabled ?? true} onChange={(e) => void client?.setChatEnabled(e.target.checked)} className="h-4 w-4 accent-[#c26a1b]" />
                    </label>
                    <div className="min-h-0 flex-1">
                      <ChatPanel messages={chat} meId={me?.id ?? ''} onSend={(t) => client!.sendChat(t)} />
                    </div>
                  </div>
                )}
                {panel === 'polls' && <PollPanel role="host" poll={poll} enabled={Boolean(features?.polls)} onStart={(q, o) => client!.startPoll(q, o)} onEnd={() => client!.endPoll()} />}
                {panel === 'people' && (
                  <div className="flex h-full flex-col">
                    <div className="flex gap-2 border-b border-white/10 px-3.5 py-2.5">
                      <button type="button" onClick={() => void client?.muteAll()} className="flex-1 rounded-lg border border-white/15 px-2 py-1.5 text-[0.78rem] font-semibold text-ivory hover:bg-white/10">
                        Mute everyone
                      </button>
                      <button type="button" onClick={() => void client?.lowerHands()} disabled={hands === 0} className="flex-1 rounded-lg border border-white/15 px-2 py-1.5 text-[0.78rem] font-semibold text-ivory hover:bg-white/10 disabled:opacity-40">
                        Lower hands
                      </button>
                    </div>
                    <ul className="thin-scroll min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto">
                      {participants.length === 0 && <li className="p-8 text-center text-[0.85rem] text-gold-soft/70">No students yet. Share the class link or ask them to open it from their dashboard.</li>}
                      {[...participants].sort((a, b) => Number(b.handRaised) - Number(a.handRaised) || a.joinedAt - b.joinedAt).map((p) => (
                        <li key={p.id} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${p.handRaised ? 'bg-saffron/15' : ''}`}>
                          <Avatar name={p.name} className="h-8 w-8 text-[0.68rem]" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-[0.86rem] font-semibold text-ivory">
                              {p.name}
                              {p.handRaised && <Hand size={14} className="shrink-0 animate-bounce text-gold" aria-label="Hand raised" />}
                            </p>
                            <p className="text-[0.7rem] text-gold-soft/70">
                              {peerStates[p.id] === 'failed' ? 'Connection problem' : peerStates[p.id] === 'poor' ? 'Weak connection' : p.media.mic ? 'Speaking allowed · mic on' : 'Listening'}
                            </p>
                          </div>
                          <button type="button" onClick={() => void client?.setPerm(p.id, { mic: !p.perm.mic })} aria-label={p.perm.mic ? `Mute ${p.name}` : `Allow ${p.name} to speak`} title={p.perm.mic ? 'Mute' : 'Allow to speak'} className={`flex h-8 w-8 items-center justify-center rounded-full ${p.perm.mic ? 'bg-ok text-white' : 'bg-white/10 text-gold-soft hover:bg-white/20'}`}>
                            {p.perm.mic ? <Mic size={15} /> : <MicOff size={15} />}
                          </button>
                          {features?.studentCamera && (
                            <button type="button" onClick={() => void client?.setPerm(p.id, { cam: !p.perm.cam })} aria-label={p.perm.cam ? `Stop ${p.name}'s camera` : `Allow ${p.name}'s camera`} title={p.perm.cam ? 'Camera allowed' : 'Allow camera'} className={`flex h-8 w-8 items-center justify-center rounded-full ${p.perm.cam ? 'bg-ok text-white' : 'bg-white/10 text-gold-soft hover:bg-white/20'}`}>
                              {p.perm.cam ? <Video size={15} /> : <VideoOff size={15} />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => window.confirm(`Remove ${p.name} from this class? They cannot rejoin.`) && void client?.kick(p.id)}
                            aria-label={`Remove ${p.name}`}
                            title="Remove from class"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-red-300 hover:bg-red-600 hover:text-white"
                          >
                            <UserX size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-veda-bark p-5 text-center shadow-2xl">
            <h2 className="font-display text-[1.3rem] font-bold text-ivory">End class for everyone?</h2>
            <p className="mt-2 text-[0.86rem] text-gold-soft/80">All {state?.students ?? 0} students are disconnected{recording ? ' and the recording is saved' : ''}. This cannot be undone.</p>
            <div className="mt-5 flex gap-2.5">
              <button type="button" disabled={ending} onClick={() => setConfirmEnd(false)} className="flex-1 rounded-xl border border-white/15 py-2.5 text-[0.88rem] font-semibold text-ivory hover:bg-white/10">
                Keep teaching
              </button>
              <button type="button" disabled={ending} onClick={() => void endClass()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-[0.88rem] font-semibold text-white hover:bg-red-700">
                {ending && <Spinner />} End class
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,#4a2610,#2a1608_60%,#1c0f05)] text-ivory">{children}</div>;
}