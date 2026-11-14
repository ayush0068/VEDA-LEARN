import { ArrowLeft, BarChart3, Download, Hand, Link2, LogOut, Maximize, MessageSquare, Mic, MicOff, Smile, Users, Video, VideoOff, Volume2, VolumeX, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { env } from '@/config/env';
import ChatPanel from '@/live/ChatPanel';
import PollPanel from '@/live/PollPanel';
import ReactionLayer, { EMOJIS } from '@/live/ReactionLayer';
import { useLiveRoom } from '@/live/useLiveRoom';
import { getStoredToken } from '@/services/api';
import { getLiveClassInfo } from '@/services/liveClass.service';
import type { StudentLiveClass } from '@/types/liveClass';

type Panel = 'chat' | 'polls' | 'info' | null;

const WHEN = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true });

const roundBtn = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-95 sm:h-12 sm:w-12 disabled:opacity-40';
const idle = `${roundBtn} border-white/15 bg-white/10 text-ivory hover:bg-white/20`;
const active = `${roundBtn} border-gold bg-gold/90 text-veda-bark`;

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,#4a2610,#2a1608_60%,#1c0f05)] text-ivory">{children}</div>;
}

function Centered({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <Shell>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-[1.7rem] font-bold text-ivory">{title}</h1>
        {text && <p className="mt-2 text-[0.92rem] text-gold-soft/80">{text}</p>}
        <div className="mt-6 flex w-full flex-col gap-2.5">{children}</div>
      </div>
    </Shell>
  );
}

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A3E14] to-saffron px-5 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60';

export default function LiveRoomStudent() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const room = useLiveRoom({ serverUrl: new URL(env.apiUrl).origin, token: getStoredToken(), classId: id, role: 'student' });
  const { client, phase, error, state, chat, poll, offline, reactions, me, title } = room;

  const [info, setInfo] = useState<StudentLiveClass | null>(null);
  const [infoError, setInfoError] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [volumeOff, setVolumeOff] = useState(false);
  const [raised, setRaised] = useState(false);
  const [perm, setPerm] = useState({ mic: false, cam: false });
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [notice, setNotice] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [voted, setVoted] = useState<Record<string, number>>({});
  const [quality, setQuality] = useState('connecting');
  const [unread, setUnread] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const selfCam = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<Panel>(null);
  panelRef.current = panel;

  useEffect(() => {
    getLiveClassInfo(id)
      .then(setInfo)
      .catch((e: unknown) => setInfoError(e instanceof Error ? e.message : 'Could not load this class'));
  }, [id]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.srcObject = hostStream;
    if (hostStream) void el.play().catch(() => {});
  }, [hostStream, phase]);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice((n) => (n === text ? '' : n)), 4500);
  };

  const enter = async () => {
    const c = await room.join();
    if (!c) return;
    const refreshVideo = () => setHasVideo(c.hostStream.getVideoTracks().some((t) => !t.muted && t.readyState === 'live'));
    c.on<MediaStream>('hostStream', (s) => {
      setHostStream(s);
      refreshVideo();
    });
    c.on('hostMedia', refreshVideo);
    c.on<string>('hostConn', setQuality);
    c.on<{ mic: boolean; cam: boolean }>('perm', async (p) => {
      setPerm(p);
      if (p.mic) {
        flash('The teacher allowed you to speak. Your microphone is on.');
        setRaised(false);
        const err = await c.setMyMic(true);
        if (err) flash(err);
      } else {
        setMicOn(false);
      }
      if (p.cam) {
        const err = await c.setMyCam(true);
        if (err) flash(err);
      } else {
        setCamOn(false);
      }
    });
    c.on<{ mic: boolean; cam: boolean }>('myMedia', (m) => {
      setMicOn(m.mic);
      setCamOn(m.cam);
    });
    c.on('handLowered', () => setRaised(false));
    c.on('hostLeft', () => flash('The teacher lost connection. Please wait, they will be back shortly.'));
    c.on('hostBack', () => flash('The teacher is back'));
    c.on('chat', () => panelRef.current !== 'chat' && setUnread((n) => n + 1));
    setHostStream(c.hostStream);
  };

  useEffect(() => {
    if (selfCam.current) selfCam.current.srcObject = camOn ? (client?.myCamStream ?? null) : null;
  }, [camOn, client]);

  useEffect(() => {
    if (video.current) video.current.muted = volumeOff;
  }, [volumeOff, phase]);

  // phones: the tab is sent to the background -> nothing to do, WebRTC keeps running. Warn before an accidental close.
  useEffect(() => {
    if (phase !== 'in') return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const leave = () => {
    room.leave();
    navigate('/dashboard/live-classes');
  };

  const toggleHand = async () => {
    const next = !raised;
    setRaised(next);
    const res = await client!.raiseHand(next);
    if (!res.ok) {
      setRaised(!next);
      flash(res.message ?? 'Could not raise your hand');
    }
  };

  const openPanel = (p: Panel) => {
    setPanel(panel === p ? null : p);
    if (p === 'chat') setUnread(0);
  };

  // ---------------------------------------------------------------- before joining
  if (phase === 'ended') {
    return (
      <Centered title="The class has ended" text="Thank you for joining. Your attendance is saved.">
        {info?.features.recording && <p className="text-[0.84rem] text-gold-soft/70">If the teacher recorded it, the recording appears in your Live Classes page.</p>}
        <Link to="/dashboard/live-classes" className={primary}>Back to live classes</Link>
      </Centered>
    );
  }
  if (phase === 'kicked') return <Centered title="You were removed from the class" text="The teacher removed you from this class."><Link to="/dashboard/live-classes" className={primary}>Back to live classes</Link></Centered>;
  if (phase === 'replaced') return <Centered title="Class opened somewhere else" text="You joined from another tab or device, so this one was closed."><Link to="/dashboard/live-classes" className={primary}>Back to live classes</Link></Centered>;

  if (phase !== 'in') {
    if (infoError && !info) {
      return (
        <Centered title="Cannot open this class" text={infoError}>
          <Link to="/dashboard/live-classes" className={primary}>Back to live classes</Link>
        </Centered>
      );
    }
    if (info?.status === 'cancelled' || info?.status === 'ended') {
      return (
        <Centered title={info.status === 'cancelled' ? 'This class was cancelled' : 'This class has ended'} text={info.title}>
          {info.recordingUrl && (
            <a href={info.recordingUrl} target="_blank" rel="noreferrer" className={primary}>
              <Video size={18} /> Watch recording
            </a>
          )}
          <Link to="/dashboard/live-classes" className="text-[0.86rem] text-gold-soft hover:text-gold">Back to live classes</Link>
        </Centered>
      );
    }

    const full = Boolean(error?.full) || (info ? info.studentsNow >= info.maxStudents && info.status === 'live' : false);
    return (
      <Shell>
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-wide text-gold">
            {info?.status === 'live' ? <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live now</> : 'Waiting room'}
          </span>
          <h1 className="mt-4 font-display text-[1.9rem] font-bold leading-tight text-ivory">{info?.title ?? 'Loading…'}</h1>
          {info && (
            <>
              <p className="mt-1.5 text-[0.92rem] text-gold-soft">with {info.host.name}</p>
              <p className="mt-1 text-[0.86rem] text-gold-soft/70">{WHEN.format(new Date(info.startsAt))}</p>
              {info.description && <p className="mt-4 text-[0.9rem] leading-relaxed text-ivory/80">{info.description}</p>}
              <p className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] text-gold-soft/80">
                <Users size={15} /> {info.studentsNow} of {info.maxStudents} seats taken
              </p>
            </>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[0.86rem] text-red-200">
              {error.message}
            </p>
          )}

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button type="button" disabled={phase === 'connecting' || full || !info} onClick={() => void enter()} className={primary}>
              {phase === 'connecting' ? 'Joining…' : full ? 'Class is full' : 'Join class'}
            </button>
            <p className="text-[0.76rem] text-gold-soft/60">You join with your microphone and camera off. You will hear and see the teacher.</p>
            <Link to="/dashboard/live-classes" className="mt-1 inline-flex items-center justify-center gap-1.5 text-[0.84rem] text-gold-soft/80 hover:text-gold">
              <ArrowLeft size={14} /> Back to live classes
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------------------------------------------------------------- in the class
  const features = state?.features;
  const waiting = !state?.hostPresent;
  const panelTitle = panel === 'chat' ? 'Class chat' : panel === 'polls' ? 'Poll' : 'About this class';

  return (
    <Shell>
      <div className="flex h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
            <h1 className="truncate font-display text-[1.05rem] font-bold text-ivory sm:text-[1.2rem]">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 text-[0.8rem] text-gold-soft">
            {state?.recording && <span className="rounded-md bg-white/10 px-2 py-0.5 font-semibold text-red-300">● Recording</span>}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 font-semibold">
              <Users size={14} /> {state?.students ?? 0}
            </span>
            {offline || quality === 'failed' ? <WifiOff size={17} className="text-red-300" aria-label="Connection problem" /> : <Wifi size={17} className={quality === 'poor' ? 'text-yellow-300' : 'text-green-400'} aria-label="Connected" />}
          </div>
        </header>

        {offline && <p className="bg-red-700/80 px-4 py-1.5 text-center text-[0.8rem] text-white">Your internet dropped. Reconnecting…</p>}

        <div className="flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
            <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <video ref={video} autoPlay playsInline className={`h-full w-full object-contain ${hasVideo && !waiting ? '' : 'invisible'}`} />
              {(!hasVideo || waiting) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-gold-soft/80">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-3xl font-bold text-gold">{(info?.host.name ?? 'T').slice(0, 1)}</span>
                  <p className="text-[0.95rem]">{waiting ? 'Waiting for the teacher to start the class…' : 'The teacher’s camera is off. You can still hear them.'}</p>
                </div>
              )}
              <ReactionLayer items={reactions} />
              {notice && <p role="status" className="absolute left-1/2 top-3 max-w-[90%] -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-center text-[0.8rem] text-white">{notice}</p>}
              {state?.locked && <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[0.7rem] text-gold-soft">Class locked</span>}
              {camOn && <video ref={selfCam} autoPlay playsInline muted className="absolute bottom-3 right-3 h-24 w-32 -scale-x-100 rounded-xl border border-white/20 object-cover shadow-xl" />}
              {raised && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-saffron px-3 py-1 text-[0.78rem] font-semibold text-white"><Hand size={14} /> Hand raised</span>}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <button type="button" onClick={() => setVolumeOff((v) => !v)} className={volumeOff ? active : idle} aria-label={volumeOff ? 'Unmute class audio' : 'Mute class audio'} title={volumeOff ? 'Unmute' : 'Mute class audio'}>
                {volumeOff ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>

              {perm.mic && (
                <button type="button" onClick={async () => { const err = await client!.setMyMic(!micOn); if (err) flash(err); }} className={micOn ? `${roundBtn} border-green-500 bg-green-600 text-white` : idle} aria-label={micOn ? 'Mute my microphone' : 'Unmute my microphone'} title={micOn ? 'Mute yourself' : 'Unmute'}>
                  {micOn ? <Mic size={19} /> : <MicOff size={19} />}
                </button>
              )}
              {perm.cam && (
                <button type="button" onClick={async () => { const err = await client!.setMyCam(!camOn); if (err) flash(err); }} className={camOn ? `${roundBtn} border-green-500 bg-green-600 text-white` : idle} aria-label={camOn ? 'Turn my camera off' : 'Turn my camera on'}>
                  {camOn ? <Video size={19} /> : <VideoOff size={19} />}
                </button>
              )}
              {features?.handRaise && !perm.mic && (
                <button type="button" onClick={() => void toggleHand()} className={raised ? active : idle} aria-label={raised ? 'Lower hand' : 'Raise hand'} title={raised ? 'Lower hand' : 'Raise hand to ask a question'}>
                  <Hand size={19} />
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
              {features?.chat && (
                <button type="button" onClick={() => openPanel('chat')} className={`relative ${panel === 'chat' ? active : idle}`} aria-label="Chat" title="Chat">
                  <MessageSquare size={19} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1 text-[0.66rem] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
                </button>
              )}
              {features?.polls && (
                <button type="button" onClick={() => openPanel('polls')} className={`relative ${panel === 'polls' ? active : idle}`} aria-label="Poll" title="Poll">
                  <BarChart3 size={19} />
                  {poll?.open && voted[poll.id] === undefined && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />}
                </button>
              )}
              <button type="button" onClick={() => openPanel('info')} className={panel === 'info' ? active : idle} aria-label="About this class" title="About / study material">
                <Link2 size={19} />
              </button>
              <button type="button" onClick={() => void stage.current?.requestFullscreen?.()} className={`${idle} hidden sm:flex`} aria-label="Full screen" title="Full screen">
                <Maximize size={18} />
              </button>
              <button type="button" onClick={leave} className={`${roundBtn} !w-auto gap-2 border-red-500 bg-red-600 px-4 text-[0.85rem] font-semibold text-white hover:bg-red-700`} aria-label="Leave class">
                <LogOut size={18} /> <span className="hidden sm:inline">Leave</span>
              </button>
            </div>
          </main>

          {panel && (
            <aside className="fixed inset-0 z-40 flex flex-col bg-veda-bark sm:static sm:z-auto sm:w-[340px] sm:shrink-0 sm:border-l sm:border-white/10 sm:bg-black/20 lg:w-[380px]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="font-display text-[1.05rem] font-bold text-ivory">{panelTitle}</h2>
                <button type="button" onClick={() => setPanel(null)} aria-label="Close panel" className="flex h-8 w-8 items-center justify-center rounded-full text-gold-soft hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                {panel === 'chat' && <ChatPanel messages={chat} meId={me?.id ?? ''} disabled={state?.chatEnabled === false} disabledText="The teacher turned chat off" onSend={(t) => client!.sendChat(t)} />}
                {panel === 'polls' && (
                  <PollPanel
                    role="student"
                    poll={poll}
                    enabled={Boolean(features?.polls)}
                    votedOption={poll ? voted[poll.id] : undefined}
                    onVote={async (pid, option) => {
                      const res = await client!.vote(pid, option);
                      if (res.ok) setVoted((v) => ({ ...v, [pid]: option }));
                      return res;
                    }}
                  />
                )}
                {panel === 'info' && (
                  <div className="thin-scroll h-full space-y-4 overflow-y-auto p-4 text-[0.88rem] text-ivory/90">
                    <p className="font-semibold text-ivory">{info?.title}</p>
                    <p className="text-gold-soft">with {info?.host.name}</p>
                    {info?.description && <p className="leading-relaxed">{info.description}</p>}
                    <div>
                      <h3 className="mb-2 text-[0.78rem] font-bold uppercase tracking-wide text-gold">Study material</h3>
                      {info?.resources.length ? (
                        <ul className="space-y-2">
                          {info.resources.map((r) => (
                            <li key={r.url}>
                              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 hover:border-gold">
                                <Download size={15} className="shrink-0 text-gold" /> <span className="min-w-0 truncate">{r.title}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gold-soft/70">No material was added for this class.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </Shell>
  );
}