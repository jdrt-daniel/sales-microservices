import type { ReactNode } from 'react';

type Kind = 'error' | 'success' | 'info' | 'warning';

const styles: Record<Kind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const icon: Record<Kind, string> = {
  error: '✕',
  success: '✓',
  info: 'i',
  warning: '!',
};

export function Alert({
  kind = 'error',
  title,
  children,
  className = '',
}: {
  kind?: Kind;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${styles[kind]} ${className}`}
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-current text-[10px] font-bold text-white"
        aria-hidden="true"
      >
        {icon[kind]}
      </span>
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="mt-0.5">{children}</div>}
      </div>
    </div>
  );
}