import { useState } from 'react';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 23 23" width="20" height="20" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

const buttonClass =
  'flex h-12 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl border border-gold/10 bg-[#fffaf0]/90 px-2 text-[0.78rem] font-semibold text-veda-bark shadow-[0_2px_8px_-4px_rgba(90,45,15,0.3)] transition-colors hover:border-gold/40 hover:bg-ivory sm:text-[0.82rem]';

/**
 * "Continue with Google / Microsoft" buttons (design only for now).
 * Real social sign-in needs OAuth client IDs from Google / Microsoft; until then a short notice is shown.
 */
export default function SocialButtons() {
  const [notice, setNotice] = useState('');

  const show = (provider: string) => setNotice(`${provider} sign-in is coming soon. Please use your email for now.`);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => show('Google')} className={buttonClass}>
          <GoogleLogo />
          <span className="truncate">
            <span className="hidden min-[400px]:inline">Continue with </span>Google
          </span>
        </button>
        <span className="h-10 w-px shrink-0 bg-gold/30" aria-hidden />
        <button type="button" onClick={() => show('Microsoft')} className={buttonClass}>
          <MicrosoftLogo />
          <span className="truncate">
            <span className="hidden min-[400px]:inline">Continue with </span>Microsoft
          </span>
        </button>
      </div>
      {notice && (
        <p role="status" className="mt-2.5 text-center text-[0.8rem] text-veda-muted">
          {notice}
        </p>
      )}
    </div>
  );
}