import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/countdown-timer';
import { RegistrationForm } from '@/components/registration-form';
import { Webinar } from '@shared/types';

export default function WebinarDetail() {
  const [, params] = useRoute('/webinar/:id');
  const [isEventLive, setIsEventLive] = useState(false);
  const webinarId = params?.id;

  const { data: webinar, isLoading } = useQuery<Webinar>({
    queryKey: ['/api/webinars', webinarId],
    enabled: !!webinarId,
  });

  useEffect(() => {
    if (webinar) {
      const eventTime = new Date(webinar.dateTime).getTime();
      const now = new Date().getTime();
      setIsEventLive(now >= eventTime);
    }
  }, [webinar]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Webinar not found</h1>
        <Link href="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const masteryItems = [
    {
      icon: 'code',
      title: 'Build a Real Project',
      text: 'Write actual code and create a functional application from scratch.'
    },
    {
      icon: 'chat',
      title: 'Live Q&A with an Expert',
      text: 'Get your questions answered in real-time by a senior developer.'
    },
    {
      icon: 'rocket',
      title: 'Career Transformation',
      text: 'Understand the exact skills you need to get hired.'
    }
  ];

  const faqs = [
    { q: "Is this workshop really free?", a: "Yes, 100% free." },
    { q: "Do I need any prior experience?", a: "No! This workshop is designed for beginners." },
    { q: "Will I get a certificate?", a: "Yes, all attendees will receive a certificate." },
    { q: "What if I miss the live session?", a: "A recording will be provided to all registered participants." }
  ];

  return (
    <div className="space-y-20">
      {/* Header Section */}
      <section className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <Link href="/">
            <Button variant="outline" className="mb-4" data-testid="button-back">
              ← Back to Events
            </Button>
          </Link>
          <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-wider text-indigo-700 bg-indigo-100 rounded-full uppercase">
            Hosted by {webinar.host}
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight" data-testid="text-webinar-title">
            {webinar.title}
          </h1>
          <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-lg text-gray-600" data-testid="text-webinar-subtitle">
            {webinar.subtitle}
          </p>
        </div>
        
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl" data-testid="section-registration">
          {isEventLive ? (
            <div>
              <h2 className="text-2xl font-bold text-center" data-testid="text-event-live">The Event is Live!</h2>
              <p className="text-center text-gray-600 mt-2">Fill in your details to join now.</p>
              <div className="mt-4">
                <RegistrationForm 
                  webinarId={webinar.id} 
                  type="registration"
                  onSuccess={(meetUrl) => {
                    if (meetUrl) {
                      window.open(meetUrl, '_blank');
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-center" data-testid="text-event-starts">Event Starts In:</h2>
              <CountdownTimer 
                targetDate={new Date(webinar.dateTime)} 
                onComplete={() => setIsEventLive(true)} 
              />
              <p className="text-center text-gray-600">Register to get a reminder!</p>
              <div className="mt-4">
                <RegistrationForm 
                  webinarId={webinar.id} 
                  type="reminder"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What You Will Master */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">What You Will Master in This Session</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {masteryItems.map((item, index) => (
            <div key={index} className="bg-white/50 backdrop-blur-sm p-6 rounded-lg border border-gray-200 text-center">
              <svg className="h-12 w-12 text-white bg-indigo-500 p-3 rounded-full mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trainer Section */}
      <section>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 items-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="md:col-span-1">
            <img 
              src={webinar.trainerImage || 'https://placehold.co/400x400/1f2937/ffffff?text=Trainer'} 
              alt={webinar.trainerName || 'Trainer'} 
              className="rounded-full mx-auto"
              data-testid="img-trainer"
            />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="text-trainer-name">
              Meet Your Trainer, {webinar.trainerName}
            </h2>
            <p className="text-indigo-600 font-semibold" data-testid="text-trainer-title">
              {webinar.trainerTitle}
            </p>
            <p className="mt-4 text-gray-600" data-testid="text-trainer-bio">
              {webinar.trainerBio}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200" data-testid={`faq-item-${index}`}>
              <h3 className="font-bold text-lg">{faq.q}</h3>
              <p className="mt-2 text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
