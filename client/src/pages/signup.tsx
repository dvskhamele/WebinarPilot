import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function SignUp() {
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startRegistration = async () => {
    setPending(true);
    setMessage(null);
    try {
      // Start OTP sign-up flow
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
      <h1 className="text-2xl font-bold">Create your account</h1>
      <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      {message && <div className="text-sm text-gray-700">{message}</div>}
      <Button onClick={startRegistration} disabled={pending}>Continue</Button>
    </div>
  );
}
