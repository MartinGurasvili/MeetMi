import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, UserCircle, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/bookings', label: 'Bookings' },
  { to: '/admin', label: 'Admin' },
];

/** Match Tailwind `md` — full nav + account from this width up; hamburger + sheet below only. */
const DESKTOP_NAV_MIN_PX = 768;

const glassPanel =
  'rounded-2xl border border-[color-mix(in_srgb,var(--color-surface-solid)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-solid)_48%,transparent)] shadow-[var(--shadow-panel)] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-[color-mix(in_srgb,var(--color-text)_6%,transparent)] dark:ring-[color-mix(in_srgb,var(--color-surface-solid)_12%,transparent)]';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_NAV_MIN_PX}px)`);
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const navLink = ({ isActive }: { isActive: boolean }) =>
    [
      'inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-black transition-all duration-200',
      isActive
        ? 'bg-[var(--color-text)] text-[var(--color-surface-solid)] shadow-[var(--shadow-soft)]'
        : 'text-[var(--color-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-[var(--color-text)]',
    ].join(' ');

  const mobileLink = ({ isActive }: { isActive: boolean }) =>
    [
      'flex w-full min-h-11 items-center rounded-xl px-3 text-sm font-black transition-all duration-200',
      isActive
        ? 'bg-[var(--color-text)] text-[var(--color-surface-solid)]'
        : 'text-[var(--color-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-[var(--color-text)]',
    ].join(' ');

  const menuButtonClass =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-solid)_35%,transparent)] text-[var(--color-text)] shadow-sm backdrop-blur-md transition hover:border-[var(--color-border-strong)] hover:bg-[color-mix(in_srgb,var(--color-surface-solid)_55%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8 animate-[fadeDown_280ms_ease-out]">
        <div className={cn('mx-auto max-w-[1800px] overflow-hidden', glassPanel)}>
          <div className="flex min-h-[3.25rem] items-center gap-2 px-3 py-2.5 md:min-h-16 md:px-4 md:py-3 xl:px-5">
            <NavLink
              to="/"
              className="shrink-0 rounded-xl px-1 py-1 text-xl font-black tracking-tight text-[var(--color-text)] transition-colors hover:text-[var(--color-primary-strong)]"
              onClick={() => setOpen(false)}
            >
              MeetMi
            </NavLink>

            <nav className="ml-1 hidden flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLink} end={item.end}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <NavLink
              to="/login"
              className="btn-secondary ml-auto hidden min-h-10 gap-2 rounded-xl px-3 py-2 text-sm md:inline-flex"
              aria-label="Account"
            >
              <UserCircle size={20} aria-hidden />
              <span>Account</span>
            </NavLink>

            {/* Wrapper hides entire mobile control at md+ — avoids tailwind-merge stripping responsive display on the trigger button. */}
            <div className="ml-auto flex shrink-0 md:hidden">
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={menuButtonClass}
                  aria-label={open ? 'Close menu' : 'Open menu'}
                  aria-expanded={open}
                  aria-controls="mobile-nav-sheet"
                >
                  {open ? <X size={22} strokeWidth={2.25} /> : <Menu size={22} strokeWidth={2.25} />}
                </button>
              </SheetTrigger>
            </div>
          </div>
        </div>
      </header>

      <SheetContent
        id="mobile-nav-sheet"
        side="right"
        className={cn(
          'w-[min(100%,20rem)] border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-solid)_72%,transparent)] backdrop-blur-2xl supports-backdrop-filter:bg-[color-mix(in_srgb,var(--color-surface-solid)_55%,transparent)] md:hidden',
        )}
      >
        <SheetHeader className="border-b border-[color-mix(in_srgb,var(--color-border)_65%,transparent)] pb-4 text-left">
          <SheetTitle className="font-black text-[var(--color-text)]">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={mobileLink} end={item.end} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/login" className={mobileLink} onClick={() => setOpen(false)} aria-label="Account">
            <UserCircle size={20} className="mr-2 shrink-0 opacity-80" aria-hidden />
            Account
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
