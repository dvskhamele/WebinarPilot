// Simple types for frontend consumption
export interface Webinar {
  id: string;
  title: string;
  host: string;
  dateTime: Date;
  category: string;
  image?: string | null;
  meetUrl?: string | null;
  subtitle?: string | null;
  trainerName?: string | null;
  trainerTitle?: string | null;
  trainerBio?: string | null;
  trainerImage?: string | null;
  createdAt?: Date | null;
}

export interface UserRegistration {
  id: string;
  webinarId: string;
  name: string;
  email: string;
  whatsappNumber?: string | null;
  registrationType: 'reminder' | 'live_join';
  createdAt?: Date | null;
}

export interface GoogleMeetSession {
  id: string;
  webinarId: string;
  meetUrl: string;
  sessionId?: string | null;
  createdAt?: Date | null;
  expiresAt?: Date | null;
}

export type InsertWebinar = Omit<Webinar, 'createdAt'>;
export type InsertUserRegistration = Omit<UserRegistration, 'id' | 'createdAt'>;
export type InsertGoogleMeetSession = Omit<GoogleMeetSession, 'id' | 'createdAt'>;