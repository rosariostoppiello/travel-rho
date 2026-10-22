import type { Category } from "@/lib/types";

type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const IconNow = ({ size = 22, className }: P) =>
  svg(size, className, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const IconPlan = ({ size = 22, className }: P) =>
  svg(size, className, <><path d="M8 6h11M8 12h11M8 18h11" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>);
export const IconMap = ({ size = 22, className }: P) =>
  svg(size, className, <><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /></>);
export const IconBag = ({ size = 22, className }: P) =>
  svg(size, className, <><rect x="4" y="7" width="16" height="13" rx="2.5" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12h16" /></>);
export const IconMore = ({ size = 22, className }: P) =>
  svg(size, className, <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>);
export const IconPlus = ({ size = 20, className }: P) => svg(size, className, <path d="M12 5v14M5 12h14" />);
export const IconClose = ({ size = 20, className }: P) => svg(size, className, <path d="M6 6l12 12M18 6 6 18" />);
export const IconPin = ({ size = 16, className }: P) =>
  svg(size, className, <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>);
export const IconLink = ({ size = 16, className }: P) =>
  svg(size, className, <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
export const IconArrow = ({ size = 16, className }: P) => svg(size, className, <path d="M5 12h14M13 6l6 6-6 6" />);
export const IconCheck = ({ size = 16, className }: P) => svg(size, className, <path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconDots = ({ size = 18, className }: P) =>
  svg(size, className, <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>);
export const IconShare = ({ size = 18, className }: P) =>
  svg(size, className, <><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></>);
export const IconDirections = ({ size = 16, className }: P) =>
  svg(size, className, <><path d="m12 3 9 9-9 9-9-9 9-9Z" /><path d="M9.5 13.5V11h5M12.5 8.5 15 11l-2.5 2.5" /></>);

export const IconPaperclip = ({ size = 16, className }: P) =>
  svg(size, className, <path d="m20 11.5-8.3 8.3a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />);
export const IconFile = ({ size = 16, className }: P) =>
  svg(size, className, <><path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5l-4-4Z" /><path d="M14 3.5v4h4M9 13h6M9 16.5h4" /></>);
export const IconLock = ({ size = 16, className }: P) =>
  svg(size, className, <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>);

export const IconSuitcase = ({ size = 20, className }: P) =>
  svg(size, className, <><rect x="6" y="6.5" width="12" height="13" rx="2" /><path d="M10 6.5V4.5h4v2M9.5 10v6M14.5 10v6M8.5 19.5V21M15.5 19.5V21" /></>);
export const IconBackpack = ({ size = 20, className }: P) =>
  svg(size, className, <><path d="M6 10a6 6 0 0 1 12 0v9.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V10Z" /><path d="M9.5 4.5a2.5 2.5 0 0 1 5 0M9 14h6v3.5H9z" /></>);
export const IconTote = ({ size = 20, className }: P) =>
  svg(size, className, <><path d="M4.5 9h15l-1.3 11h-12.4L4.5 9Z" /><path d="M8.5 9a3.5 3.5 0 0 1 7 0" /></>);

export function CategoryIcon({ c, size = 16 }: { c: Category; size?: number }) {
  const paths: Record<Category, React.ReactNode> = {
    comida: <><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" /><path d="M17 21V3c-2 1.5-3 4-3 7h3" /></>,
    paseo: <><path d="M4 20c2.5-5 5-7.5 8-7.5s5.5 2.5 8 7.5" /><circle cx="15.5" cy="6.5" r="2.5" /></>,
    shopping: <><path d="M5.5 8h13l-1 12h-11l-1-12Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
    cultura: <><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></>,
    evento: <><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
    transporte: <><rect x="5" y="3.5" width="14" height="14" rx="3" /><path d="M5 11h14M8.5 21l1.5-3.5M15.5 21 14 17.5" /><circle cx="8.5" cy="14.3" r=".6" /><circle cx="15.5" cy="14.3" r=".6" /></>,
    alojamiento: <><path d="M3 18V8M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5" /><circle cx="7" cy="11" r="1.8" /></>,
    otro: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5M12 15.5v.5" /></>,
  };
  return svg(size, undefined, paths[c]);
}
