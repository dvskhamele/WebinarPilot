import { type Webinar, type InsertWebinar, type UserRegistration, type InsertUserRegistration, type GoogleMeetSession, type InsertGoogleMeetSession } from "@shared/types";
import { randomUUID } from "crypto";
import { createClient } from '@supabase/supabase-js';

export interface IStorage {
  // Webinars
  getWebinars(): Promise<Webinar[]>;
  getWebinar(id: string): Promise<Webinar | undefined>;
  createWebinar(webinar: InsertWebinar): Promise<Webinar>;
  
  // User Registrations
  getUserRegistrations(webinarId: string): Promise<UserRegistration[]>;
  createUserRegistration(registration: InsertUserRegistration): Promise<UserRegistration>;
  
  // Google Meet Sessions
  getGoogleMeetSession(webinarId: string): Promise<GoogleMeetSession | undefined>;
  createGoogleMeetSession(session: InsertGoogleMeetSession): Promise<GoogleMeetSession>;
}

// Simple in-memory storage as fallback
export class MemStorage implements IStorage {
  private webinars: Map<string, Webinar> = new Map();
  private userRegistrations: Map<string, UserRegistration> = new Map();
  private googleMeetSessions: Map<string, GoogleMeetSession> = new Map();

  async getWebinars(): Promise<Webinar[]> {
    return Array.from(this.webinars.values());
  }

  async getWebinar(id: string): Promise<Webinar | undefined> {
    return this.webinars.get(id);
  }

  async createWebinar(insertWebinar: InsertWebinar): Promise<Webinar> {
    const webinar: Webinar = { ...insertWebinar, createdAt: new Date() };
    this.webinars.set(webinar.id, webinar);
    return webinar;
  }

  async getUserRegistrations(webinarId: string): Promise<UserRegistration[]> {
    return Array.from(this.userRegistrations.values()).filter(r => r.webinarId === webinarId);
  }

  async createUserRegistration(insertRegistration: InsertUserRegistration): Promise<UserRegistration> {
    const registration: UserRegistration = {
      ...insertRegistration,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.userRegistrations.set(registration.id, registration);
    return registration;
  }

  async getGoogleMeetSession(webinarId: string): Promise<GoogleMeetSession | undefined> {
    return Array.from(this.googleMeetSessions.values()).find(s => s.webinarId === webinarId);
  }

  async createGoogleMeetSession(insertSession: InsertGoogleMeetSession): Promise<GoogleMeetSession> {
    const session: GoogleMeetSession = {
      ...insertSession,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.googleMeetSessions.set(session.id, session);
    return session;
  }
}

// Supabase Storage Implementation
export class SupabaseStorage implements IStorage {
  private supabase;
  
  constructor() {
    const supabaseUrl = 'https://brroucjplqmngljroknr.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc';
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async getWebinars(): Promise<Webinar[]> {
    const { data, error } = await this.supabase
      .from('webinars')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching webinars:', error);
      throw new Error('Failed to fetch webinars');
    }
    
    // Transform from Supabase format to our format
    return data?.map(this.transformWebinarFromSupabase) || [];
  }

  async getWebinar(id: string): Promise<Webinar | undefined> {
    const { data, error } = await this.supabase
      .from('webinars')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      console.error('Error fetching webinar:', error);
      throw new Error('Failed to fetch webinar');
    }
    
    return data ? this.transformWebinarFromSupabase(data) : undefined;
  }

  async createWebinar(insertWebinar: InsertWebinar): Promise<Webinar> {
    const { data, error } = await this.supabase
      .from('webinars')
      .insert(this.transformWebinarToSupabase(insertWebinar))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating webinar:', error);
      throw new Error('Failed to create webinar');
    }
    
    return this.transformWebinarFromSupabase(data);
  }

  async getUserRegistrations(webinarId: string): Promise<UserRegistration[]> {
    const { data, error } = await this.supabase
      .from('webinar_registrations')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching registrations:', error);
      throw new Error('Failed to fetch registrations');
    }
    
    return data?.map(this.transformRegistrationFromSupabase) || [];
  }

  async createUserRegistration(insertRegistration: InsertUserRegistration): Promise<UserRegistration> {
    const { data, error } = await this.supabase
      .from('webinar_registrations')
      .insert({
        webinar_id: insertRegistration.webinarId,
        name: insertRegistration.name,
        email: insertRegistration.email,
        whatsapp_number: insertRegistration.whatsappNumber,
        registration_type: insertRegistration.registrationType,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating registration:', error);
      throw new Error('Failed to create registration');
    }
    
    return this.transformRegistrationFromSupabase(data);
  }

  async getGoogleMeetSession(webinarId: string): Promise<GoogleMeetSession | undefined> {
    // For now, return a basic session using the webinar's meet_url
    const webinar = await this.getWebinar(webinarId);
    if (webinar?.meetUrl) {
      return {
        id: `session-${webinarId}`,
        webinarId: webinarId,
        meetUrl: webinar.meetUrl,
        sessionId: `session_${Date.now()}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }
    return undefined;
  }

  async createGoogleMeetSession(insertSession: InsertGoogleMeetSession): Promise<GoogleMeetSession> {
    // For simplicity, we'll just return a mock session since the Google Meet URL is stored in the webinar
    return {
      id: randomUUID(),
      webinarId: insertSession.webinarId,
      meetUrl: insertSession.meetUrl,
      sessionId: insertSession.sessionId || `session_${Date.now()}`,
      createdAt: new Date(),
      expiresAt: insertSession.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  private transformWebinarFromSupabase(supabaseWebinar: any): Webinar {
    return {
      id: supabaseWebinar.id,
      title: supabaseWebinar.title,
      host: supabaseWebinar.host,
      dateTime: new Date(`${supabaseWebinar.date}T${supabaseWebinar.time}`),
      category: supabaseWebinar.category,
      image: supabaseWebinar.image,
      meetUrl: supabaseWebinar.meet_url,
      subtitle: supabaseWebinar.subtitle,
      trainerName: supabaseWebinar.trainer_name,
      trainerTitle: supabaseWebinar.trainer_title,
      trainerBio: supabaseWebinar.trainer_bio,
      trainerImage: supabaseWebinar.trainer_image,
      createdAt: new Date(supabaseWebinar.created_at),
    };
  }

  private transformWebinarToSupabase(webinar: InsertWebinar): any {
    const dateTime = new Date(webinar.dateTime);
    return {
      id: webinar.id,
      title: webinar.title,
      host: webinar.host,
      date: dateTime.toISOString().split('T')[0],
      time: dateTime.toTimeString().split(' ')[0],
      category: webinar.category,
      image: webinar.image,
      meet_url: webinar.meetUrl,
      subtitle: webinar.subtitle,
      trainer_name: webinar.trainerName,
      trainer_title: webinar.trainerTitle,
      trainer_bio: webinar.trainerBio,
      trainer_image: webinar.trainerImage,
    };
  }

  private transformRegistrationFromSupabase(supabaseReg: any): UserRegistration {
    return {
      id: supabaseReg.id,
      webinarId: supabaseReg.webinar_id,
      name: supabaseReg.name,
      email: supabaseReg.email,
      whatsappNumber: supabaseReg.whatsapp_number,
      registrationType: supabaseReg.registration_type,
      createdAt: new Date(supabaseReg.created_at),
    };
  }
}

// Use Supabase storage
export const storage = new SupabaseStorage();
