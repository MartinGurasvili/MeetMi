import { FormEvent, useState } from 'react';
import { api } from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('user@meetmi.local');
  const [password, setPassword] = useState('UserPass123');
  const [message, setMessage] = useState('Use seeded demo credentials after running backend seed.');
  async function submit(event: FormEvent) { event.preventDefault(); try { await api.login(email, password); setMessage('Signed in. Access token is kept in memory; refresh token is HttpOnly cookie.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Login failed'); } }
  return <main className="mx-auto max-w-md px-6 py-10"><form onSubmit={submit} className="glass rounded-[2rem] p-6"><h1 className="text-3xl font-semibold">Welcome back</h1><label className="mt-5 block text-sm">Email<input className="mt-1 w-full rounded-xl bg-white/10 p-3" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="mt-3 block text-sm">Password<input className="mt-1 w-full rounded-xl bg-white/10 p-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="mt-5 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Login</button><p className="mt-4 text-sm text-slate-300">{message}</p></form></main>;
}
