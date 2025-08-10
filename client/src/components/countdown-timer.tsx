import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        onComplete();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex justify-center gap-4 my-6 text-center">
      <div className="text-center" data-testid="countdown-days">
        <div className="text-4xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
        <div className="text-xs uppercase">Days</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="text-center" data-testid="countdown-hours">
        <div className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-xs uppercase">Hours</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="text-center" data-testid="countdown-minutes">
        <div className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-xs uppercase">Mins</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="text-center" data-testid="countdown-seconds">
        <div className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-xs uppercase">Secs</div>
      </div>
    </div>
  );
}
