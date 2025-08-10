import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserRegistrationSchema, insertGoogleMeetSessionSchema } from "@shared/schema";
import { z } from "zod";
import { WebinarScheduler } from "./scrapers/scheduler";
import { supabase } from "./supabase";

// In-memory stores (fallback if Supabase DDL not available)
const otpStore = new Map<string, { code: string; expiresAt: number; consumed: boolean }>();
const alertSubscriptions = new Map<string, { categories: string[]; active: boolean }>();

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
  // Initialize scheduler
  const scheduler = new WebinarScheduler();
  scheduler.startScheduler();

  // Get all webinars; on Netlify run a scrape synchronously before returning
  app.get("/api/webinars", async (req, res) => {
    try {
      // Always run scrapers in background only
      scheduler.handleUserTrigger().catch(err => console.error('Background scrape failed:', err));
      const webinars = await storage.getWebinars();
      res.json(webinars);
    } catch (error) {
      console.error('Failed to fetch webinars:', error);
      res.status(500).json({ error: "Failed to fetch webinars" });
    }
  });

  // Search webinars; on Netlify run a targeted scrape first
  app.get("/api/webinars/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }

      // Log search query (best effort)
      try {
        await supabase.from('search_logs').insert({ query, created_at: new Date().toISOString() });
      } catch (e) {
        // Table may not exist; ignore
      }

      // Always run scrapers in background only
      scheduler.handleUserTrigger(undefined, query).catch(err => console.error('Search scrape failed:', err));

      const webinars = await storage.getWebinars();
      const searchResults = webinars.filter(w => 
        w.title?.toLowerCase().includes(query.toLowerCase()) ||
        w.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        w.host?.toLowerCase().includes(query.toLowerCase())
      );

      res.json(searchResults);
    } catch (error) {
      console.error('Failed to search webinars:', error);
      res.status(500).json({ error: "Failed to search webinars" });
    }
  });

  // Category-based webinar search; on Netlify run a targeted scrape first
  app.get("/api/webinars/category/:category", async (req, res) => {
    try {
      const category = req.params.category;

      // Always run scrapers in background only
      scheduler.handleUserTrigger(category).catch(err => console.error('Category scrape failed:', err));

      const webinars = await storage.getWebinars();
      const categoryWebinars = webinars.filter(w => 
        w.category?.toLowerCase() === category.toLowerCase()
      );

      res.json(categoryWebinars);
    } catch (error) {
      console.error('Failed to fetch category webinars:', error);
      res.status(500).json({ error: "Failed to fetch category webinars" });
    }
  });

  // Get single webinar; on Netlify trigger category scrape synchronously if needed
  app.get("/api/webinars/:id", async (req, res) => {
    try {
      const webinar = await storage.getWebinar(req.params.id);
      if (!webinar) {
        return res.status(404).json({ error: "Webinar not found" });
      }
      
      if (webinar.category) {
        // Always run scrapers in background only
        scheduler.handleUserTrigger(webinar.category).catch(err => console.error('Category-based scrape failed:', err));
      }
      
      res.json(webinar);
    } catch (error) {
      console.error('Failed to fetch webinar:', error);
      res.status(500).json({ error: "Failed to fetch webinar" });
    }
  });

  // Auth: request OTP
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email required' });

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(email.toLowerCase(), { code, expiresAt, consumed: false });

      // Best-effort persist (table may not exist)
      try {
        await supabase.from('otp_codes').insert({ email, code, expires_at: new Date(expiresAt).toISOString(), consumed: false });
      } catch (_e) {}

      // In production, send via email/SMS. For now, do not include code in response.
      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to request OTP' });
    }
  });

  // Auth: verify OTP and optionally subscribe
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, code, categories } = req.body || {};
      if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
      const rec = otpStore.get(email.toLowerCase());
      if (!rec) return res.status(400).json({ error: 'No OTP requested' });
      if (rec.consumed) return res.status(400).json({ error: 'OTP already used' });
      if (Date.now() > rec.expiresAt) return res.status(400).json({ error: 'OTP expired' });
      if (String(code) !== rec.code) return res.status(400).json({ error: 'Invalid OTP' });

      rec.consumed = true;

      if (Array.isArray(categories) && categories.length > 0) {
        alertSubscriptions.set(email.toLowerCase(), { categories, active: true });
        try { await supabase.from('alert_subscriptions').upsert({ email, categories, active: true }); } catch (_e) {}
      }

      const user = { name: (email as string).split('@')[0], email };
      res.json({ success: true, user, subscribedCategories: categories || [] });
    } catch (e) {
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  // Alerts: subscribe/unsubscribe
  app.post('/api/alerts/subscribe', async (req, res) => {
    try {
      const { email, categories } = req.body || {};
      if (!email || !Array.isArray(categories)) return res.status(400).json({ error: 'Email and categories required' });
      alertSubscriptions.set(email.toLowerCase(), { categories, active: true });
      try { await supabase.from('alert_subscriptions').upsert({ email, categories, active: true }); } catch (_e) {}
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  app.post('/api/alerts/unsubscribe', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email required' });
      alertSubscriptions.set(email.toLowerCase(), { categories: [], active: false });
      try { await supabase.from('alert_subscriptions').upsert({ email, categories: [], active: false }); } catch (_e) {}
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
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

  // Related webinars endpoint
  app.get('/api/webinars/:id/related', async (req, res) => {
    try {
      const target = await storage.getWebinar(req.params.id);
      if (!target) return res.json([]);
      const webinars = await storage.getWebinars();

      const stop = new Set(['the','a','an','for','and','or','to','in','on','with','of','by','at','from','this','that','how','learn','free','live','workshop','webinar']);
      const tokenize = (s: string) => (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g,' ')
        .split(/\s+/)
        .filter(t => t && !stop.has(t));

      const targetTokens = new Set<string>([...tokenize(target.title), ...tokenize(target.subtitle || '')]);

      const scored = webinars
        .filter(w => w.id !== target.id)
        .map(w => {
          let score = 0;
          if (w.category && target.category && w.category.toLowerCase() === target.category.toLowerCase()) score += 2;
          const tokens = new Set<string>([...tokenize(w.title), ...tokenize(w.subtitle || '')]);
          let overlap = 0;
          tokens.forEach(t => { if (targetTokens.has(t)) overlap++; });
          score += overlap;
          return { w, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => x.w);

      res.json(scored);
    } catch (e) {
      console.error('Failed to get related webinars:', e);
      res.status(500).json({ error: 'Failed to get related webinars' });
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

  // Blog: list posts
  app.get("/api/blog", async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("id,title,slug,content,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("Failed to fetch blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  // Blog: single post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select("id,title,slug,content,created_at")
        .eq("slug", req.params.slug)
        .single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Post not found" });
      res.json(data);
    } catch (error: any) {
      console.error("Failed to fetch blog post:", error);
      if (error?.code === 'PGRST116') return res.status(404).json({ error: "Post not found" });
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  // Recent searches (best effort if search_logs exists)
  app.get('/api/searches/recent', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('search_logs')
        .select('query, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      // Return unique queries preserving order
      const seen = new Set<string>();
      const unique = (data || []).filter((r: any) => {
        if (seen.has(r.query)) return false; seen.add(r.query); return true;
      });
      res.json(unique);
    } catch (_e) {
      res.json([]);
    }
  });

  // Grouped endpoints
  app.get('/api/webinars/happening-now', async (_req, res) => {
    try {
      const webinars = await storage.getWebinars();
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      const list = webinars.filter(w => {
        const start = new Date(w.dateTime).getTime();
        return Math.abs(start - now) <= twoHours || (now >= start && now <= start + twoHours);
      });
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch happening now' });
    }
  });

  app.get('/api/webinars/happening-today', async (_req, res) => {
    try {
      const webinars = await storage.getWebinars();
      const today = new Date();
      const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
      const startDay = new Date(y, m, d).getTime();
      const endDay = new Date(y, m, d + 1).getTime();
      const list = webinars.filter(w => {
        const t = new Date(w.dateTime).getTime();
        return t >= startDay && t < endDay;
      });
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch happening today' });
    }
  });

  app.get('/api/webinars/grouped/category', async (_req, res) => {
    try {
      const webinars = await storage.getWebinars();
      const grouped: Record<string, any[]> = {};
      webinars.forEach(w => {
        const key = (w.category || 'Uncategorized');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(w);
      });
      res.json(grouped);
    } catch (e) {
      res.status(500).json({ error: 'Failed to group webinars by category' });
    }
  });

  // Manual scraper trigger endpoint
  app.post("/api/scrape/trigger", async (req, res) => {
    try {
      const { category, keyword, force } = req.body;
      
      console.log('Manual scrape triggered:', { category, keyword, force });
      
      const result = await scheduler.orchestrator.scrapeAll({
        category,
        keyword,
        triggerType: 'manual',
        force: force || false
      });

      res.json({
        success: true,
        message: result.message,
        totalNewWebinars: result.totalNewWebinars,
        results: result.results
      });
    } catch (error) {
      console.error('Manual scrape failed:', error);
      res.status(500).json({ error: "Scrape failed", message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
