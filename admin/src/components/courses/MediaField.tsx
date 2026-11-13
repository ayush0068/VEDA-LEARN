import { FileText, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Spinner, btnSecondary, inputClass } from '@/components/common/ui';
import { mediaSrc, uploadFile } from '@/services/courses.service';
import type { UploadKind } from '@/types/course';
import CourseImage from './CourseImage';

const MB = 1024 * 1024;
const KINDS: Record<UploadKind, { accept: string; types: string[]; max: number; label: string; button: string }> = {
  image: { accept: 'image/jpeg,image/png,image/webp,image/gif', types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], max: 5 * MB, label: 'JPG, PNG, WebP or GIF up to 5 MB', button: 'Upload image' },
  video: { accept: 'video/mp4,video/webm', types: ['video/mp4', 'video/webm'], max: 300 * MB, label: 'MP4 or WebM up to 300 MB', button: 'Upload video' },
  document: { accept: 'application/pdf', types: ['application/pdf'], max: 20 * MB, label: 'PDF up to 20 MB', button: 'Upload PDF' },
};

interface Props {
  label: string;
  kind: UploadKind;
  value: string;
  onChange: (value: string) => void;
  /** what to show under the field, e.g. where it appears on the website */
  hint: string;
  /** placeholder of the link box */
  placeholder?: string;
}

/** Upload a file from the computer OR paste a link / path. Shows a preview and the upload progress. */
export default function MediaField({ label, kind, value, onChange, hint, placeholder }: Props) {
  const spec = KINDS[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [broken, setBroken] = useState(false);
  const uploading = progress !== null;

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!spec.types.includes(file.type)) return setError(`Please choose a file of this kind: ${spec.label}.`);
    if (file.size > spec.max) return setError(`This file is too large. Allowed: ${spec.label}.`);

    setError('');
    setProgress(0);
    try {
      const result = await uploadFile(kind, file, setProgress);
      setBroken(false);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setProgress(null);
    }
  };

  const src = value ? mediaSrc(value) : '';

  return (
    <div>
      <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">{label}</span>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white/60 p-3 sm:flex-row">
        {/* preview */}
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream sm:w-44">
          {kind === 'image' && value ? (
            <CourseImage
              value={value}
              className="h-full w-full object-cover"
              fallback={
                <span className="flex flex-col items-center gap-1 text-[0.72rem] text-veda-muted">
                  <ImagePlus size={26} strokeWidth={1.4} aria-hidden /> No preview
                </span>
              }
            />
          ) : !src || broken ? (
            <span className="flex flex-col items-center gap-1 text-[0.72rem] text-veda-muted">
              {kind === 'document' ? <FileText size={26} strokeWidth={1.4} aria-hidden /> : <ImagePlus size={26} strokeWidth={1.4} aria-hidden />}
              {src ? 'No preview' : 'Nothing added'}
            </span>
          ) : kind === 'video' ? (
            /youtu\.?be/.test(src) ? (
              <span className="px-2 text-center text-[0.72rem] text-veda-muted">YouTube link</span>
            ) : (
              <video src={src} muted preload="metadata" onError={() => setBroken(true)} className="h-full w-full bg-black object-cover" />
            )
          ) : (
            <a href={src} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 text-[0.78rem] font-semibold text-saffron hover:underline">
              <FileText size={28} strokeWidth={1.4} aria-hidden /> Open PDF
            </a>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={`${btnSecondary} !py-2`}>
              {uploading ? <Spinner /> : <Upload size={15} aria-hidden />}
              {uploading ? `Uploading ${progress}%` : spec.button}
            </button>
            {value && !uploading && (
              <button type="button" onClick={() => onChange('')} className={`${btnSecondary} !py-2 text-red-700`}>
                <Trash2 size={15} aria-hidden /> Remove
              </button>
            )}
            <input ref={inputRef} type="file" accept={spec.accept} onChange={pick} className="hidden" aria-label={spec.button} />
          </div>

          {uploading && (
            <div className="h-1.5 overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-saffron transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}

          <input
            value={value}
            onChange={(e) => {
              setBroken(false);
              onChange(e.target.value);
            }}
            disabled={uploading}
            placeholder={placeholder ?? 'or paste a link (https://…)'}
            maxLength={500}
            aria-label={`${label} link`}
            className={`${inputClass} !py-2`}
          />
          <p className="text-[0.74rem] leading-snug text-veda-muted">
            {spec.label}. {hint}
          </p>
          {error && (
            <p role="alert" className="text-[0.78rem] text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}