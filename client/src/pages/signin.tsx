import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function SignIn() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sendOtp = async () => {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send OTP');
      setMessage('OTP sent! Redirecting to verification...');
      setTimeout(() => navigate(`/verify?email=${encodeURIComponent(email)}`), 600);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {message && <div className="text-sm text-gray-700">{message}</div>}
      <Button onClick={sendOtp} disabled={pending}>Send OTP</Button>
    </div>
  );
}
