import { Download, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import type { LessonDetail } from '@/types/learning';

const youtubeId = (url: string) => /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url)?.[1];
const vimeoId = (url: string) => /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)?.[1];

/** The main content of a lesson: video player (upload / YouTube / Vimeo), article text or a PDF. */
export default function LessonMedia({ lesson, onVideoEnded }: { lesson: LessonDetail['lesson']; onVideoEnded: () => void }) {
  const [failed, setFailed] = useState(false);

  if (lesson.type === 'article') {
    return (
      <article className="rounded-2xl border border-gold/25 bg-white/70 p-5 shadow-soft sm:p-7">
        <p className="whitespace-pre-wrap text-[1rem] leading-relaxed text-veda-text">{lesson.content}</p>
      </article>
    );
  }

  if (lesson.type === 'document') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-gold/25 bg-white/70 px-5 py-10 text-center shadow-soft">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-pale text-saffron">
          <FileText size={30} strokeWidth={1.5} aria-hidden />
        </span>
        <p className="font-display text-[1.1rem] font-bold text-veda-bark">{lesson.title}</p>
        <p className="text-[0.85rem] text-veda-muted">Read this lesson as a PDF.</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a href={lesson.mediaUrl} target="_blank" rel="noreferrer" className="btn-primary">
            <ExternalLink size={16} aria-hidden /> Open PDF
          </a>
          <a href={lesson.mediaUrl} download className="btn-outline">
            <Download size={16} aria-hidden /> Download
          </a>
        </div>
      </div>
    );
  }

  const yt = youtubeId(lesson.mediaUrl);
  const vimeo = vimeoId(lesson.mediaUrl);
  const frame = yt ? `https://www.youtube-nocookie.com/embed/${yt}?rel=0` : vimeo ? `https://player.vimeo.com/video/${vimeo}` : '';

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-soft">
      {frame ? (
        <iframe src={frame} title={lesson.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-ivory">
          <p className="text-[0.95rem]">This video could not be loaded.</p>
          <a href={lesson.mediaUrl} target="_blank" rel="noreferrer" className="text-[0.85rem] text-gold-soft underline">
            Open it in a new tab
          </a>
        </div>
      ) : (
        <video key={lesson.id} src={lesson.mediaUrl} className="h-full w-full bg-black" controls playsInline preload="metadata" controlsList="nodownload" onEnded={onVideoEnded} onError={() => setFailed(true)} aria-label={lesson.title} />
      )}
    </div>
  );
}