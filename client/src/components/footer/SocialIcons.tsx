// Small inline brand icons (lucide-react no longer ships brand logos).
interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const InstagramIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const YouTubeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
  </svg>
);

export const FacebookIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14.5 21v-7.5H17l.5-3h-3V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v1.9H9v3h2.5V21" />
  </svg>
);

export const XIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
  </svg>
);

export const SOCIAL_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  Facebook: FacebookIcon,
  X: XIcon,
};