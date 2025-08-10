import { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CATEGORIES, COMMUNITY_LINKS } from '@/lib/constants';

export default function Verify() {
  const [loc, navigate] = useLocation();
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const emailParam = params.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const communityUrl = COMMUNITY_LINKS.default;

  const toggleCat = (cat: string) => {
    setSelected((prev) => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  async function verify() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, categories: selected })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Verification failed');
      localStorage.setItem('currentUser', JSON.stringify(json.user));
      setMessage('Verified! Preferences saved.');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setPending(false);
    }
  }

  async function requestOtp() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send OTP');
      setMessage('OTP sent to your email');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Verify your email</h1>

      <div className="space-y-3">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="flex gap-2">
          <Button onClick={requestOtp} disabled={pending}>Send OTP</Button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">OTP Code</label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Choose your alert categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => toggleCat(c)} className={`px-3 py-1 rounded-full border text-sm ${selected.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      {message && <div className="text-sm text-gray-700">{message}</div>}

      <div className="flex gap-3 items-center">
        <Button onClick={verify} disabled={pending}>Verify & Save</Button>
        <Button variant="outline" onClick={() => navigate('/')}>Skip</Button>
        <a className="ml-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-semibold" href={communityUrl} target="_blank" rel="noreferrer">Join WhatsApp Community</a>
      </div>
    </div>
  );
}
