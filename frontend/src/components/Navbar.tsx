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

const DESKTOP_NAV_MIN_PX = 768;

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn('app-nav-link', isActive && 'is-active');

  const menuButtonClass =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/14 bg-white/8 text-[#f6f8ff] shadow-sm backdrop-blur-md transition hover:border-white/24 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(10,132,255,0.35)]';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8 animate-[fadeDown_280ms_ease-out]">
        <div className="app-navbar-shell mx-auto max-w-[1800px] overflow-hidden">
          <div className="flex min-h-[3.25rem] items-center gap-2 px-3 py-2.5 md:min-h-16 md:px-4 md:py-3 xl:px-5">
            <NavLink
              to="/"
              className="shrink-0 rounded-xl px-1 py-1 text-xl font-black tracking-tight text-[#f6f8ff] transition-colors hover:text-[#7ec8ff]"
              onClick={() => setOpen(false)}
            >
              MeetMi
            </NavLink>

            <nav className="ml-1 hidden flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.end}>
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
        className="w-[min(100%,20rem)] border-white/14 bg-[linear-gradient(180deg,rgba(35,38,48,0.92),rgba(18,20,27,0.88))] backdrop-blur-2xl md:hidden"
      >
        <SheetHeader className="border-b border-white/12 pb-4 text-left">
          <SheetTitle className="font-black text-[#f6f8ff]">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.end} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/login" className={navLinkClass} onClick={() => setOpen(false)} aria-label="Account">
            <UserCircle size={20} className="mr-2 inline shrink-0 opacity-80" aria-hidden />
            Account
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
