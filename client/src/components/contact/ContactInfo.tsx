import { Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { CONTACT_INFO } from '@/constants/contact';

function InfoRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-5 py-6 first:pt-0 last:pb-0 sm:gap-6">
      <span className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full bg-gold-pale/70 text-saffron shadow-[inset_0_0_0_1px_rgba(197,139,43,0.12)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-[1.45rem] font-bold leading-tight text-veda-bark">{title}</h2>
        <div className="mt-1 text-[1.02rem] leading-snug text-veda-bark">{children}</div>
      </div>
    </li>
  );
}

/** Left column: phone, e-mail and location. Phone / e-mail are real tel: / mailto: links. */
export default function ContactInfo() {
  const { phone, email, location } = CONTACT_INFO;

  return (
    <ul className="divide-y divide-gold/25">
      <InfoRow icon={<Phone size={34} strokeWidth={1.4} aria-hidden />} title="Call Us">
        <a href={phone.href} className="transition-colors hover:text-saffron">
          {phone.label}
        </a>
        <p className="mt-0.5 text-[0.92rem] text-veda-muted">({phone.hours})</p>
      </InfoRow>

      <InfoRow icon={<Mail size={34} strokeWidth={1.4} aria-hidden />} title="Email Us">
        <a href={email.href} className="break-all transition-colors hover:text-saffron">
          {email.label}
        </a>
      </InfoRow>

      <InfoRow icon={<MapPin size={34} strokeWidth={1.4} aria-hidden />} title="Our Location">
        <address className="not-italic">
          {location.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      </InfoRow>
    </ul>
  );
}