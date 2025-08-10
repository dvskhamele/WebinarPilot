import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uuid, pgEnum, time, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrationTypeEnum = pgEnum('registration_type', ['reminder', 'live_join']);

// Match existing Supabase webinars table structure
export const webinars = pgTable("webinars", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  dateTime: timestamp("date_time").notNull(), // Use combined dateTime for easier handling
  category: text("category").notNull(),
  image: text("image"),
  meetUrl: text("meet_url"),
  subtitle: text("subtitle"),
  trainerName: text("trainer_name"),
  trainerTitle: text("trainer_title"),
  trainerBio: text("trainer_bio"),
  trainerImage: text("trainer_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRegistrations = pgTable("webinar_registrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  webinarId: varchar("webinar_id").notNull().references(() => webinars.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  whatsappNumber: text("whatsapp_number"),
  registrationType: registrationTypeEnum("registration_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const googleMeetSessions = pgTable("google_meet_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  webinarId: varchar("webinar_id").notNull().references(() => webinars.id),
  meetUrl: text("meet_url").notNull(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertWebinarSchema = createInsertSchema(webinars);
export const insertUserRegistrationSchema = createInsertSchema(userRegistrations).omit({
  id: true,
  createdAt: true,
});
export const insertGoogleMeetSessionSchema = createInsertSchema(googleMeetSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertWebinar = z.infer<typeof insertWebinarSchema>;
export type Webinar = typeof webinars.$inferSelect;
export type InsertUserRegistration = z.infer<typeof insertUserRegistrationSchema>;
export type UserRegistration = typeof userRegistrations.$inferSelect;
export type InsertGoogleMeetSession = z.infer<typeof insertGoogleMeetSessionSchema>;
export type GoogleMeetSession = typeof googleMeetSessions.$inferSelect;
