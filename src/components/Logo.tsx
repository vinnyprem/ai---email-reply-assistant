import { MailPlus } from 'lucide-react';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow"
        style={{ width: size, height: size }}
      >
        <MailPlus size={size * 0.5} className="text-white" strokeWidth={2.2} />
      </div>
    </div>
  );
}

export function LogoWithText({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div className="leading-tight">
        <p className="font-display font-semibold text-white text-[15px] tracking-tight">
          AI Email Reply
        </p>
        <p className="text-[11px] text-ink-400 font-medium tracking-wide uppercase">
          Assistant
        </p>
      </div>
    </div>
  );
}
