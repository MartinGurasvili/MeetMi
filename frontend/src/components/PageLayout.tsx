import type { ReactNode } from 'react';
import AppBackButton from './AppBackButton';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'narrow';
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function PageLayout({ children, variant = 'default', showBack = true, backTo = '/', backLabel }: Props) {
  const maxWidth = variant === 'narrow' ? 'max-w-xl' : 'max-w-7xl';
  return (
    <main className="app-shell-page">
      <div className={`app-shell-inner mx-auto w-full ${maxWidth}`}>
        {showBack ? <AppBackButton to={backTo} label={backLabel} /> : null}
        {children}
      </div>
    </main>
  );
}
