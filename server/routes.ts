import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserRegistrationSchema, insertGoogleMeetSessionSchema } from "@shared/schema";
import { z } from "zod";

const registrationRequestSchema = z.object({
  type: z.literal("registration"),
  webinarId: z.string(),
  name: z.string(),
  email: z.string().email(),
  whatsappNumber: z.string().optional(),
});

const reminderRequestSchema = z.object({
  type: z.literal("reminder"),
  webinarId: z.string(),
  email: z.string().email(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all webinars
  app.get("/api/webinars", async (req, res) => {
    try {
      const webinars = await storage.getWebinars();
      res.json(webinars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webinars" });
    }
  });

  // Get single webinar
  app.get("/api/webinars/:id", async (req, res) => {
    try {
      const webinar = await storage.getWebinar(req.params.id);
      if (!webinar) {
        return res.status(404).json({ error: "Webinar not found" });
      }
      res.json(webinar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webinar" });
    }
  });

  // Handle webinar registration and reminders
  app.post("/api/webinar-action", async (req, res) => {
    try {
      const body = req.body;
      
      if (body.type === "registration") {
        const validatedData = registrationRequestSchema.parse(body);
        
        // Create user registration
        const registration = await storage.createUserRegistration({
          webinarId: validatedData.webinarId,
          name: validatedData.name,
          email: validatedData.email,
          whatsappNumber: validatedData.whatsappNumber || null,
          registrationType: "live_join",
        });

        // Get or create Google Meet session
        let meetSession = await storage.getGoogleMeetSession(validatedData.webinarId);
        if (!meetSession) {
          const webinar = await storage.getWebinar(validatedData.webinarId);
          if (webinar?.meetUrl) {
            meetSession = await storage.createGoogleMeetSession({
              webinarId: validatedData.webinarId,
              meetUrl: webinar.meetUrl,
              sessionId: `session_${Date.now()}`,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });
          }
        }

        // Simulate Google Sheets integration
        console.log("Syncing to Google Sheets:", registration);

        res.json({
          success: true,
          meetUrl: meetSession?.meetUrl || "https://meet.google.com/pnz-piqy-vvx",
          registrationId: registration.id,
        });

      } else if (body.type === "reminder") {
        const validatedData = reminderRequestSchema.parse(body);
        
        // Create reminder registration
        const registration = await storage.createUserRegistration({
          webinarId: validatedData.webinarId,
          name: "Reminder User",
          email: validatedData.email,
          whatsappNumber: null,
          registrationType: "reminder",
        });

        console.log("Setting reminder for:", registration);

        res.json({
          success: true,
          message: "Reminder set successfully",
          registrationId: registration.id,
        });

      } else {
        res.status(400).json({ error: "Invalid request type" });
      }

    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process request" });
      }
    }
  });

  // Get registrations for a webinar
  app.get("/api/webinars/:id/registrations", async (req, res) => {
    try {
      const registrations = await storage.getUserRegistrations(req.params.id);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Admin endpoint to get all registrations across all webinars
  app.get("/api/admin/registrations", async (req, res) => {
    try {
      const webinars = await storage.getWebinars();
      const allRegistrations = [];
      
      for (const webinar of webinars) {
        const registrations = await storage.getUserRegistrations(webinar.id);
        registrations.forEach(reg => {
          allRegistrations.push({
            ...reg,
            webinarTitle: webinar.title,
            webinarHost: webinar.host,
            webinarDate: webinar.dateTime,
          });
        });
      }
      
      res.json({
        totalRegistrations: allRegistrations.length,
        registrations: allRegistrations,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all registrations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
