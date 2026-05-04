import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Mail, Shield } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('user@meetmi.local');
  const [password, setPassword] = useState('UserPass123');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.login(email, password);
      await refreshUser();
      navigate('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-backdrop" aria-hidden />
      <div className="login-page-inner">
        <Link to="/" className="login-page-back">
          <ArrowLeft size={18} aria-hidden />
          Map
        </Link>

        <div className="login-page-grid">
          <section className="login-page-aside" aria-hidden>
            <p className="login-page-brand">MeetMi</p>
            <h1 className="login-page-tagline">Book the right desk or room in seconds.</h1>
            <p className="login-page-aside-copy">Dark, focused sign-in — same look as the workspace map.</p>
          </section>

          <section className="login-page-card" aria-labelledby="login-heading">
            <div className="login-page-card-icon">
              <Shield size={22} aria-hidden />
            </div>
            <p className="login-page-kicker">Account</p>
            <h1 id="login-heading" className="login-page-title">
              Sign in
            </h1>
            <p className="login-page-lead">Use your work email. Demo credentials stay prefilled for local use.</p>

            <form onSubmit={submit} className="login-page-form">
              <label className="login-page-label">
                <span className="login-page-label-row">
                  <Mail size={15} aria-hidden />
                  Email
                </span>
                <input
                  className="login-page-field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                />
              </label>
              <label className="login-page-label">
                Password
                <input
                  className="login-page-field"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </label>
              <button type="submit" className="login-page-submit" disabled={submitting}>
                <LogIn size={17} aria-hidden />
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {message ? (
              <p className="login-page-message" role="status">
                {message}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
