import { CheckCircle2, CircleAlert } from 'lucide-react';

export type AppToastTone = 'success' | 'error' | 'info';

interface Props {
  message: string;
  tone?: AppToastTone;
}

export default function AppToast({ message, tone = 'info' }: Props) {
  if (!message) return null;

  return (
    <div className={`app-toast is-${tone}`} role="status" aria-live="polite">
      {tone === 'success' ? <CheckCircle2 size={18} aria-hidden /> : <CircleAlert size={18} aria-hidden />}
      <span>{message}</span>
    </div>
  );
}
