import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Narrower reading width for forms */
  variant?: 'default' | 'narrow';
}

export default function PageLayout({ children, variant = 'default' }: Props) {
  const max = variant === 'narrow' ? 'max-w-xl' : 'max-w-7xl';
  return (
    <main className={`mx-auto w-full ${max} px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8`}>
      {children}
    </main>
  );
}
