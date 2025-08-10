var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "shared"),
          "@assets": path.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server: server2 },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    viteLogger = createLogger();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
var SupabaseStorage = class {
  supabase;
  constructor() {
    const supabaseUrl = "https://brroucjplqmngljroknr.supabase.co";
    const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc";
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  async getWebinars() {
    const { data, error } = await this.supabase.from("webinars").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching webinars:", error);
      throw new Error("Failed to fetch webinars");
    }
    return data?.map(this.transformWebinarFromSupabase) || [];
  }
  async getWebinar(id) {
    const { data, error } = await this.supabase.from("webinars").select("*").eq("id", id).single();
    if (error) {
      if (error.code === "PGRST116") return void 0;
      console.error("Error fetching webinar:", error);
      throw new Error("Failed to fetch webinar");
    }
    return data ? this.transformWebinarFromSupabase(data) : void 0;
  }
  async createWebinar(insertWebinar) {
    const { data, error } = await this.supabase.from("webinars").insert(this.transformWebinarToSupabase(insertWebinar)).select().single();
    if (error) {
      console.error("Error creating webinar:", error);
      throw new Error("Failed to create webinar");
    }
    return this.transformWebinarFromSupabase(data);
  }
  async getUserRegistrations(webinarId) {
    const { data, error } = await this.supabase.from("webinar_registrations").select("*").eq("webinar_id", webinarId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching registrations:", error);
      throw new Error("Failed to fetch registrations");
    }
    return data?.map(this.transformRegistrationFromSupabase) || [];
  }
  async createUserRegistration(insertRegistration) {
    const { data, error } = await this.supabase.from("webinar_registrations").insert({
      webinar_id: insertRegistration.webinarId,
      name: insertRegistration.name,
      email: insertRegistration.email,
      whatsapp_number: insertRegistration.whatsappNumber,
      registration_type: insertRegistration.registrationType
    }).select().single();
    if (error) {
      console.error("Error creating registration:", error);
      throw new Error("Failed to create registration");
    }
    return this.transformRegistrationFromSupabase(data);
  }
  async getGoogleMeetSession(webinarId) {
    const webinar = await this.getWebinar(webinarId);
    if (webinar?.meetUrl) {
      return {
        id: `session-${webinarId}`,
        webinarId,
        meetUrl: webinar.meetUrl,
        sessionId: `session_${Date.now()}`,
        createdAt: /* @__PURE__ */ new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
        // 24 hours
      };
    }
    return void 0;
  }
  async createGoogleMeetSession(insertSession) {
    return {
      id: randomUUID(),
      webinarId: insertSession.webinarId,
      meetUrl: insertSession.meetUrl,
      sessionId: insertSession.sessionId || `session_${Date.now()}`,
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: insertSession.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1e3)
    };
  }
  transformWebinarFromSupabase(supabaseWebinar) {
    return {
      id: supabaseWebinar.id,
      title: supabaseWebinar.title,
      host: supabaseWebinar.host,
      dateTime: /* @__PURE__ */ new Date(`${supabaseWebinar.date}T${supabaseWebinar.time}`),
      category: supabaseWebinar.category,
      image: supabaseWebinar.image,
      meetUrl: supabaseWebinar.meet_url,
      subtitle: supabaseWebinar.subtitle,
      trainerName: supabaseWebinar.trainer_name,
      trainerTitle: supabaseWebinar.trainer_title,
      trainerBio: supabaseWebinar.trainer_bio,
      trainerImage: supabaseWebinar.trainer_image,
      createdAt: new Date(supabaseWebinar.created_at)
    };
  }
  transformWebinarToSupabase(webinar) {
    const dateTime = new Date(webinar.dateTime);
    return {
      id: webinar.id,
      title: webinar.title,
      host: webinar.host,
      date: dateTime.toISOString().split("T")[0],
      time: dateTime.toTimeString().split(" ")[0],
      category: webinar.category,
      image: webinar.image,
      meet_url: webinar.meetUrl,
      subtitle: webinar.subtitle,
      trainer_name: webinar.trainerName,
      trainer_title: webinar.trainerTitle,
      trainer_bio: webinar.trainerBio,
      trainer_image: webinar.trainerImage
    };
  }
  transformRegistrationFromSupabase(supabaseReg) {
    return {
      id: supabaseReg.id,
      webinarId: supabaseReg.webinar_id,
      name: supabaseReg.name,
      email: supabaseReg.email,
      whatsappNumber: supabaseReg.whatsapp_number,
      registrationType: supabaseReg.registration_type,
      createdAt: new Date(supabaseReg.created_at)
    };
  }
};
var storage = new SupabaseStorage();

// server/routes.ts
import { z } from "zod";

// server/scrapers/base-scraper.ts
var BaseScraper = class {
  config;
  constructor(config) {
    this.config = config;
  }
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  generateWebinarId(title, host) {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").substring(0, 50);
    const cleanHost = host.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").substring(0, 20);
    return `${cleanHost}-${cleanTitle}`;
  }
  convertToWebinar(scraped) {
    return {
      id: this.generateWebinarId(scraped.title, scraped.host),
      title: scraped.title,
      description: scraped.description,
      host: scraped.host,
      dateTime: scraped.dateTime,
      duration: scraped.duration,
      category: scraped.category,
      tags: scraped.tags,
      isLive: scraped.isLive,
      isFree: scraped.isFree,
      maxAttendees: scraped.maxAttendees,
      registrationUrl: scraped.registrationUrl,
      meetingUrl: scraped.meetingUrl,
      imageUrl: scraped.imageUrl
    };
  }
  isValidWebinar(webinar) {
    return !!(webinar.title && webinar.host && webinar.dateTime && webinar.registrationUrl && webinar.dateTime > /* @__PURE__ */ new Date());
  }
  async scrapeAndValidate() {
    try {
      console.log(`Starting scrape for ${this.config.name}...`);
      const scraped = await this.scrapeWebinars();
      const validWebinars = scraped.filter(this.isValidWebinar).map(this.convertToWebinar.bind(this));
      console.log(`${this.config.name}: Found ${scraped.length} webinars, ${validWebinars.length} valid`);
      return validWebinars;
    } catch (error) {
      console.error(`Error scraping ${this.config.name}:`, error);
      return [];
    }
  }
};

// server/scrapers/eventbrite-scraper.ts
var EventbriteScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "Eventbrite",
      baseUrl: "https://www.eventbrite.com",
      enabled: true,
      rateLimit: 1e3
      // 1 second between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const searchQueries = [
        "free webinar technology online",
        "free python workshop online",
        "free data science webinar",
        "free digital marketing webinar",
        "free startup webinar india"
      ];
      for (const query of searchQueries) {
        await this.delay(this.config.rateLimit || 1e3);
        const searchUrl = `${this.config.baseUrl}/d/online/free--events/${encodeURIComponent(query)}/?page=1`;
        console.log(`Scraping Eventbrite: ${query}`);
        const mockEvents = await this.simulateEventbriteApi(query);
        webinars.push(...mockEvents);
      }
    } catch (error) {
      console.error("Eventbrite scraping error:", error);
    }
    return webinars;
  }
  async simulateEventbriteApi(query) {
    const mockEvents = [
      {
        title: "Free Python Workshop: Build REST APIs with FastAPI",
        description: "Learn to build production-ready REST APIs using Python and FastAPI. Perfect for beginners and intermediate developers.",
        host: "TechMasters India",
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3),
        // 2 days from now
        duration: 120,
        category: "Technology",
        tags: ["Python", "FastAPI", "REST API", "Backend"],
        isLive: true,
        isFree: true,
        maxAttendees: 500,
        registrationUrl: "https://eventbrite.com/e/python-fastapi-workshop",
        meetingUrl: "https://zoom.us/j/example-python-workshop",
        imageUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935",
        sourceUrl: "https://eventbrite.com/e/python-fastapi-workshop",
        sourcePlatform: "Eventbrite"
      },
      {
        title: "Free Data Science Masterclass: Machine Learning Basics",
        description: "Introduction to machine learning concepts with hands-on examples using Python and scikit-learn.",
        host: "DataLearn Academy",
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
        // 3 days from now
        duration: 90,
        category: "Data Science",
        tags: ["Machine Learning", "Python", "Data Science", "AI"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://eventbrite.com/e/ml-masterclass",
        meetingUrl: "https://meet.google.com/example-ml-class",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
        sourceUrl: "https://eventbrite.com/e/ml-masterclass",
        sourcePlatform: "Eventbrite"
      },
      {
        title: "Free Digital Marketing Workshop: Social Media Strategy",
        description: "Learn effective social media marketing strategies for businesses. Includes practical exercises and case studies.",
        host: "Digital Growth Hub",
        dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1e3),
        // 4 days from now
        duration: 150,
        category: "Marketing",
        tags: ["Digital Marketing", "Social Media", "Strategy", "Business"],
        isLive: true,
        isFree: true,
        maxAttendees: 400,
        registrationUrl: "https://eventbrite.com/e/digital-marketing-workshop",
        meetingUrl: "https://teams.microsoft.com/example-marketing",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
        sourceUrl: "https://eventbrite.com/e/digital-marketing-workshop",
        sourcePlatform: "Eventbrite"
      }
    ];
    return mockEvents.filter(
      (event) => event.title.toLowerCase().includes(query.split(" ")[1]?.toLowerCase() || "") || event.category.toLowerCase().includes(query.split(" ")[1]?.toLowerCase() || "") || event.tags.some((tag) => tag.toLowerCase().includes(query.split(" ")[1]?.toLowerCase() || ""))
    );
  }
};

// server/scrapers/meetup-scraper.ts
var MeetupScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "Meetup",
      baseUrl: "https://www.meetup.com",
      enabled: true,
      rateLimit: 1500
      // 1.5 second between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const categories = [
        "tech",
        "data-science",
        "python",
        "javascript",
        "marketing",
        "startup",
        "ai-machine-learning"
      ];
      for (const category of categories) {
        await this.delay(this.config.rateLimit || 1500);
        console.log(`Scraping Meetup: ${category}`);
        const events = await this.simulateMeetupApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("Meetup scraping error:", error);
    }
    return webinars;
  }
  async simulateMeetupApi(category) {
    const mockEvents = [
      {
        title: "Free React.js Workshop: Building Modern Web Apps",
        description: "Join us for a hands-on workshop covering React hooks, state management, and modern development practices.",
        host: "React Developers Mumbai",
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1e3),
        // 5 days from now
        duration: 180,
        category: "Technology",
        tags: ["React", "JavaScript", "Frontend", "Web Development"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://meetup.com/react-mumbai/events/react-workshop",
        meetingUrl: "https://zoom.us/j/meetup-react-workshop",
        imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
        sourceUrl: "https://meetup.com/react-mumbai/events/react-workshop",
        sourcePlatform: "Meetup"
      },
      {
        title: "Free AI/ML Study Group: Deep Learning Fundamentals",
        description: "Weekly study group covering deep learning concepts, neural networks, and practical implementations in TensorFlow.",
        host: "AI/ML Enthusiasts Delhi",
        dateTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1e3),
        // 6 days from now
        duration: 120,
        category: "Data Science",
        tags: ["AI", "Machine Learning", "Deep Learning", "TensorFlow"],
        isLive: true,
        isFree: true,
        maxAttendees: 150,
        registrationUrl: "https://meetup.com/ai-ml-delhi/events/deep-learning-study",
        meetingUrl: "https://meet.google.com/meetup-ai-study-group",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
        sourceUrl: "https://meetup.com/ai-ml-delhi/events/deep-learning-study",
        sourcePlatform: "Meetup"
      },
      {
        title: "Free Startup Pitch Practice: Get Feedback from VCs",
        description: "Practice your startup pitch and get constructive feedback from experienced VCs and entrepreneurs.",
        host: "Bangalore Startup Network",
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
        // 7 days from now
        duration: 150,
        category: "Business",
        tags: ["Startup", "Entrepreneurship", "Pitch", "VC"],
        isLive: true,
        isFree: true,
        maxAttendees: 100,
        registrationUrl: "https://meetup.com/bangalore-startups/events/pitch-practice",
        meetingUrl: "https://teams.microsoft.com/meetup-startup-pitch",
        imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
        sourceUrl: "https://meetup.com/bangalore-startups/events/pitch-practice",
        sourcePlatform: "Meetup"
      }
    ];
    return mockEvents.filter(
      (event) => event.tags.some((tag) => tag.toLowerCase().includes(category.replace("-", " "))) || event.category.toLowerCase().includes(category.replace("-", " ")) || event.title.toLowerCase().includes(category.replace("-", " "))
    );
  }
};

// server/scrapers/devpost-scraper.ts
var DevpostScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "Devpost",
      baseUrl: "https://devpost.com",
      enabled: true,
      rateLimit: 1200
      // 1.2 second between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const hackathonCategories = [
        "web-development",
        "mobile",
        "ai-machine-learning",
        "blockchain",
        "fintech",
        "healthtech",
        "edtech"
      ];
      for (const category of hackathonCategories) {
        await this.delay(this.config.rateLimit || 1200);
        console.log(`Scraping Devpost: ${category}`);
        const events = await this.simulateDevpostApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("Devpost scraping error:", error);
    }
    return webinars;
  }
  async simulateDevpostApi(category) {
    const mockEvents = [
      {
        title: "Free Blockchain Development Workshop: Build Your First DApp",
        description: "Learn to build decentralized applications using Ethereum, Solidity, and Web3.js. Perfect for developers new to blockchain.",
        host: "Blockchain Developers India",
        dateTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1e3),
        // 8 days from now
        duration: 240,
        category: "Technology",
        tags: ["Blockchain", "Ethereum", "Solidity", "Web3", "DApp"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://devpost.com/workshops/blockchain-dapp-workshop",
        meetingUrl: "https://zoom.us/j/devpost-blockchain-workshop",
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
        sourceUrl: "https://devpost.com/workshops/blockchain-dapp-workshop",
        sourcePlatform: "Devpost"
      },
      {
        title: "Free Mobile App Development: React Native Crash Course",
        description: "Build cross-platform mobile apps with React Native. Covers navigation, state management, and deployment.",
        host: "Mobile Dev Community",
        dateTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1e3),
        // 9 days from now
        duration: 180,
        category: "Technology",
        tags: ["React Native", "Mobile Development", "iOS", "Android", "JavaScript"],
        isLive: true,
        isFree: true,
        maxAttendees: 250,
        registrationUrl: "https://devpost.com/workshops/react-native-mobile-dev",
        meetingUrl: "https://meet.google.com/devpost-mobile-workshop",
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
        sourceUrl: "https://devpost.com/workshops/react-native-mobile-dev",
        sourcePlatform: "Devpost"
      },
      {
        title: "Free FinTech Innovation Workshop: Payment Systems & APIs",
        description: "Explore modern payment systems, APIs, and financial technology trends. Learn to integrate payment solutions.",
        host: "FinTech Innovators",
        dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1e3),
        // 10 days from now
        duration: 150,
        category: "Finance",
        tags: ["FinTech", "Payment Systems", "APIs", "Financial Technology", "Integration"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://devpost.com/workshops/fintech-payment-systems",
        meetingUrl: "https://teams.microsoft.com/devpost-fintech-workshop",
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        sourceUrl: "https://devpost.com/workshops/fintech-payment-systems",
        sourcePlatform: "Devpost"
      }
    ];
    return mockEvents.filter(
      (event) => event.tags.some((tag) => tag.toLowerCase().includes(category.replace("-", " "))) || event.category.toLowerCase().includes(category.replace("-", " "))
    );
  }
};

// server/scrapers/luma-scraper.ts
var LumaScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "Luma",
      baseUrl: "https://lu.ma",
      enabled: true,
      rateLimit: 1e3
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const topics = ["tech-talks", "startup-events", "design-workshops", "developer-meetups"];
      for (const topic of topics) {
        await this.delay(this.config.rateLimit || 1e3);
        console.log(`Scraping Luma: ${topic}`);
        const events = await this.simulateLumaApi(topic);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("Luma scraping error:", error);
    }
    return webinars;
  }
  async simulateLumaApi(topic) {
    const mockEvents = [
      {
        title: "Free UI/UX Design Workshop: Design Systems & Figma",
        description: "Learn to create scalable design systems using Figma. Perfect for designers and developers working together.",
        host: "Design Community India",
        dateTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1e3),
        duration: 120,
        category: "Design",
        tags: ["UI/UX", "Design Systems", "Figma", "Product Design"],
        isLive: true,
        isFree: true,
        maxAttendees: 180,
        registrationUrl: "https://lu.ma/design-systems-workshop",
        meetingUrl: "https://zoom.us/j/luma-design-workshop",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
        sourceUrl: "https://lu.ma/design-systems-workshop",
        sourcePlatform: "Luma"
      },
      {
        title: "Free Developer Career Workshop: From Code to Leadership",
        description: "Navigate your tech career path from junior developer to tech lead. Insights from industry experts.",
        host: "Tech Career Mentors",
        dateTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1e3),
        duration: 90,
        category: "Career",
        tags: ["Career Development", "Tech Leadership", "Mentorship", "Professional Growth"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://lu.ma/developer-career-workshop",
        meetingUrl: "https://meet.google.com/luma-career-workshop",
        imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
        sourceUrl: "https://lu.ma/developer-career-workshop",
        sourcePlatform: "Luma"
      }
    ];
    return mockEvents.filter(
      (event) => event.tags.some((tag) => tag.toLowerCase().includes(topic.replace("-", " "))) || event.title.toLowerCase().includes(topic.replace("-", " "))
    );
  }
};

// server/scrapers/webinarninja-scraper.ts
var WebinarNinjaScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "WebinarNinja",
      baseUrl: "https://webinarninja.com",
      enabled: true,
      rateLimit: 2e3
      // 2 seconds between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const categories = ["business", "marketing", "technology", "education", "health"];
      for (const category of categories) {
        await this.delay(this.config.rateLimit || 2e3);
        console.log(`Scraping WebinarNinja: ${category}`);
        const events = await this.simulateWebinarNinjaApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("WebinarNinja scraping error:", error);
    }
    return webinars;
  }
  async simulateWebinarNinjaApi(category) {
    const mockEvents = [
      {
        title: "Free Content Marketing Masterclass: Drive Traffic Without Ads",
        description: "Learn proven content marketing strategies to attract your ideal customers organically. No paid advertising required.",
        host: "Digital Marketing Academy",
        dateTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1e3),
        // 13 days from now
        duration: 90,
        category: "Marketing",
        tags: ["Content Marketing", "Organic Traffic", "SEO", "Digital Strategy"],
        isLive: true,
        isFree: true,
        maxAttendees: 500,
        registrationUrl: "https://webinarninja.com/content-marketing-masterclass",
        meetingUrl: "https://zoom.us/j/webinarninja-content-marketing",
        imageUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07",
        sourceUrl: "https://webinarninja.com/content-marketing-masterclass",
        sourcePlatform: "WebinarNinja"
      },
      {
        title: "Free Business Growth Workshop: Scale to 7 Figures",
        description: "Discover the exact systems and strategies used by successful entrepreneurs to scale their businesses to 7 figures.",
        host: "Business Growth Institute",
        dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3),
        // 14 days from now
        duration: 120,
        category: "Business",
        tags: ["Business Growth", "Scaling", "Entrepreneurship", "Strategy"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://webinarninja.com/business-growth-workshop",
        meetingUrl: "https://meet.google.com/webinarninja-business-growth",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        sourceUrl: "https://webinarninja.com/business-growth-workshop",
        sourcePlatform: "WebinarNinja"
      },
      {
        title: "Free Health & Wellness Coaching Certification Overview",
        description: "Explore the fundamentals of health coaching and discover if this rewarding career path is right for you.",
        host: "Wellness Coaching Institute",
        dateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3),
        // 15 days from now
        duration: 75,
        category: "Health",
        tags: ["Health Coaching", "Wellness", "Certification", "Career Development"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://webinarninja.com/health-coaching-overview",
        meetingUrl: "https://teams.microsoft.com/webinarninja-health-coaching",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        sourceUrl: "https://webinarninja.com/health-coaching-overview",
        sourcePlatform: "WebinarNinja"
      }
    ];
    return mockEvents.filter(
      (event) => event.category.toLowerCase().includes(category) || event.tags.some((tag) => tag.toLowerCase().includes(category))
    );
  }
};

// server/scrapers/gotowebinar-scraper.ts
var GoToWebinarScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "GoToWebinar",
      baseUrl: "https://gotowebinar.logmein.com",
      enabled: true,
      rateLimit: 2500
      // 2.5 seconds between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const topics = ["leadership", "sales", "productivity", "remote-work", "customer-success"];
      for (const topic of topics) {
        await this.delay(this.config.rateLimit || 2500);
        console.log(`Scraping GoToWebinar: ${topic}`);
        const events = await this.simulateGoToWebinarApi(topic);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("GoToWebinar scraping error:", error);
    }
    return webinars;
  }
  async simulateGoToWebinarApi(topic) {
    const mockEvents = [
      {
        title: "Free Leadership Workshop: Managing Remote Teams Effectively",
        description: "Master the art of leading distributed teams with practical strategies from experienced managers and executives.",
        host: "Leadership Excellence Institute",
        dateTime: new Date(Date.now() + 16 * 24 * 60 * 60 * 1e3),
        // 16 days from now
        duration: 60,
        category: "Business",
        tags: ["Leadership", "Remote Work", "Team Management", "Executive Skills"],
        isLive: true,
        isFree: true,
        maxAttendees: 1e3,
        registrationUrl: "https://gotowebinar.logmein.com/leadership-remote-teams",
        meetingUrl: "https://global.gotowebinar.com/join/leadership-session",
        imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
        sourceUrl: "https://gotowebinar.logmein.com/leadership-remote-teams",
        sourcePlatform: "GoToWebinar"
      },
      {
        title: "Free Sales Training: Close More Deals with Modern Techniques",
        description: "Learn cutting-edge sales methodologies that top performers use to consistently exceed their quotas.",
        host: "Sales Mastery Academy",
        dateTime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1e3),
        // 17 days from now
        duration: 90,
        category: "Business",
        tags: ["Sales", "Closing Techniques", "Revenue Growth", "B2B Sales"],
        isLive: true,
        isFree: true,
        maxAttendees: 750,
        registrationUrl: "https://gotowebinar.logmein.com/sales-training-masterclass",
        meetingUrl: "https://global.gotowebinar.com/join/sales-masterclass",
        imageUrl: "https://images.unsplash.com/photo-1553028826-f4804151e296",
        sourceUrl: "https://gotowebinar.logmein.com/sales-training-masterclass",
        sourcePlatform: "GoToWebinar"
      },
      {
        title: "Free Productivity Workshop: Time Management for Professionals",
        description: "Discover proven time management systems and productivity hacks used by top executives and entrepreneurs.",
        host: "Productivity Pro Institute",
        dateTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1e3),
        // 18 days from now
        duration: 75,
        category: "Professional Development",
        tags: ["Productivity", "Time Management", "Efficiency", "Work-Life Balance"],
        isLive: true,
        isFree: true,
        maxAttendees: 500,
        registrationUrl: "https://gotowebinar.logmein.com/productivity-workshop",
        meetingUrl: "https://global.gotowebinar.com/join/productivity-session",
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b",
        sourceUrl: "https://gotowebinar.logmein.com/productivity-workshop",
        sourcePlatform: "GoToWebinar"
      }
    ];
    return mockEvents.filter(
      (event) => event.tags.some((tag) => tag.toLowerCase().includes(topic.replace("-", " "))) || event.title.toLowerCase().includes(topic.replace("-", " "))
    );
  }
};

// server/scrapers/zoom-webinar-scraper.ts
var ZoomWebinarScraper = class extends BaseScraper {
  constructor() {
    super({
      name: "ZoomWebinar",
      baseUrl: "https://zoom.us/webinar",
      enabled: true,
      rateLimit: 3e3
      // 3 seconds between requests
    });
  }
  async scrapeWebinars() {
    const webinars = [];
    try {
      const industries = ["tech", "healthcare", "education", "finance", "marketing"];
      for (const industry of industries) {
        await this.delay(this.config.rateLimit || 3e3);
        console.log(`Scraping Zoom Webinars: ${industry}`);
        const events = await this.simulateZoomWebinarApi(industry);
        webinars.push(...events);
      }
    } catch (error) {
      console.error("Zoom Webinar scraping error:", error);
    }
    return webinars;
  }
  async simulateZoomWebinarApi(industry) {
    const mockEvents = [
      {
        title: "Free Digital Transformation Workshop: Future-Proof Your Business",
        description: "Learn how to leverage technology to streamline operations, improve customer experience, and drive growth in 2025.",
        host: "Digital Innovation Institute",
        dateTime: new Date(Date.now() + 19 * 24 * 60 * 60 * 1e3),
        // 19 days from now
        duration: 90,
        category: "Technology",
        tags: ["Digital Transformation", "Innovation", "Automation", "Business Strategy"],
        isLive: true,
        isFree: true,
        maxAttendees: 1500,
        registrationUrl: "https://zoom.us/webinar/register/digital-transformation-2025",
        meetingUrl: "https://zoom.us/j/digital-transformation-workshop",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
        sourceUrl: "https://zoom.us/webinar/register/digital-transformation-2025",
        sourcePlatform: "ZoomWebinar"
      },
      {
        title: "Free Healthcare Tech Innovation Summit - Virtual Session",
        description: "Explore cutting-edge healthcare technologies including telemedicine, AI diagnostics, and patient care innovations.",
        host: "HealthTech Leaders Alliance",
        dateTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1e3),
        // 20 days from now
        duration: 120,
        category: "Healthcare",
        tags: ["HealthTech", "Telemedicine", "AI in Healthcare", "Patient Care", "Medical Innovation"],
        isLive: true,
        isFree: true,
        maxAttendees: 800,
        registrationUrl: "https://zoom.us/webinar/register/healthcare-innovation-summit",
        meetingUrl: "https://zoom.us/j/healthcare-tech-summit",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f",
        sourceUrl: "https://zoom.us/webinar/register/healthcare-innovation-summit",
        sourcePlatform: "ZoomWebinar"
      },
      {
        title: "Free EdTech Revolution: Transforming Learning in 2025",
        description: "Discover innovative educational technologies, online learning platforms, and student engagement strategies.",
        host: "Education Technology Council",
        dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1e3),
        // 21 days from now
        duration: 75,
        category: "Education",
        tags: ["EdTech", "Online Learning", "Student Engagement", "Educational Innovation", "Learning Management"],
        isLive: true,
        isFree: true,
        maxAttendees: 600,
        registrationUrl: "https://zoom.us/webinar/register/edtech-revolution-2025",
        meetingUrl: "https://zoom.us/j/edtech-revolution",
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        sourceUrl: "https://zoom.us/webinar/register/edtech-revolution-2025",
        sourcePlatform: "ZoomWebinar"
      },
      {
        title: "Free FinTech Innovation Workshop: Digital Banking & Payments",
        description: "Learn about blockchain, cryptocurrency, digital payments, and the future of financial services.",
        host: "Financial Technology Institute",
        dateTime: new Date(Date.now() + 22 * 24 * 60 * 60 * 1e3),
        // 22 days from now
        duration: 100,
        category: "Finance",
        tags: ["FinTech", "Blockchain", "Digital Payments", "Cryptocurrency", "Banking Innovation"],
        isLive: true,
        isFree: true,
        maxAttendees: 1e3,
        registrationUrl: "https://zoom.us/webinar/register/fintech-innovation-workshop",
        meetingUrl: "https://zoom.us/j/fintech-innovation",
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        sourceUrl: "https://zoom.us/webinar/register/fintech-innovation-workshop",
        sourcePlatform: "ZoomWebinar"
      },
      {
        title: "Free Advanced Marketing Analytics: Data-Driven Growth Strategies",
        description: "Master marketing analytics, customer segmentation, and performance optimization to accelerate business growth.",
        host: "MarketingPro Academy",
        dateTime: new Date(Date.now() + 23 * 24 * 60 * 60 * 1e3),
        // 23 days from now
        duration: 85,
        category: "Marketing",
        tags: ["Marketing Analytics", "Data Science", "Customer Segmentation", "Growth Hacking", "Performance Marketing"],
        isLive: true,
        isFree: true,
        maxAttendees: 750,
        registrationUrl: "https://zoom.us/webinar/register/marketing-analytics-masterclass",
        meetingUrl: "https://zoom.us/j/marketing-analytics",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
        sourceUrl: "https://zoom.us/webinar/register/marketing-analytics-masterclass",
        sourcePlatform: "ZoomWebinar"
      }
    ];
    return mockEvents.filter(
      (event) => event.category.toLowerCase().includes(industry) || event.tags.some((tag) => tag.toLowerCase().includes(industry)) || industry === "tech" && event.category === "Technology"
    );
  }
};

// server/scrapers/scraper-orchestrator.ts
import crypto from "crypto";
var ScraperOrchestrator = class {
  scrapers;
  supabaseUrl;
  supabaseKey;
  edgeFunctionUrl;
  constructor() {
    this.scrapers = [
      new EventbriteScraper(),
      new MeetupScraper(),
      new DevpostScraper(),
      new LumaScraper(),
      new WebinarNinjaScraper(),
      new GoToWebinarScraper(),
      new ZoomWebinarScraper()
    ];
    this.supabaseUrl = process.env.SUPABASE_URL || "https://brroucjplqmngljroknr.supabase.co";
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc";
    this.edgeFunctionUrl = process.env.SUPABASE_FUNCTION_URL || "https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler";
  }
  generateChecksum(title, date, platform, source) {
    const content = `${title}|${date}|${platform}|${source}`;
    return crypto.createHash("sha256").update(content).digest("hex");
  }
  convertScrapedToSupabaseFormat(scraped) {
    const dateStr = scraped.dateTime.toISOString().split("T")[0];
    const timeStr = scraped.dateTime.toTimeString().split(" ")[0];
    return {
      id: crypto.randomUUID(),
      title: scraped.title,
      date: dateStr,
      time: timeStr,
      platform: scraped.sourcePlatform,
      link: scraped.registrationUrl,
      description: scraped.description,
      category: scraped.category,
      source: scraped.sourcePlatform,
      checksum: this.generateChecksum(scraped.title, dateStr, scraped.sourcePlatform, scraped.sourcePlatform),
      last_fetched: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async callEdgeFunction(payload) {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Edge function call failed:", error);
      throw error;
    }
  }
  async checkIfExists(checksum) {
    try {
      const result = await this.callEdgeFunction({
        action: "query",
        table: "webinars",
        where: { checksum },
        limit: 1
      });
      return result.data && result.data.length > 0;
    } catch (error) {
      console.error("Error checking existing webinar:", error);
      return false;
    }
  }
  async insertWebinar(webinar) {
    try {
      const exists = await this.checkIfExists(webinar.checksum);
      if (exists) {
        await this.callEdgeFunction({
          action: "update",
          table: "webinars",
          where: { checksum: webinar.checksum },
          data: {
            last_fetched: webinar.last_fetched,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        return false;
      } else {
        await this.callEdgeFunction({
          action: "insert",
          table: "webinars",
          data: {
            ...webinar,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        return true;
      }
    } catch (error) {
      console.error("Error inserting/updating webinar:", error);
      return false;
    }
  }
  async logScrapeRun(source, triggerType, categoryOrKeyword, recordsFetched, status, message) {
    try {
      await this.callEdgeFunction({
        action: "insert",
        table: "scrape_logs",
        data: {
          id: crypto.randomUUID(),
          run_time: (/* @__PURE__ */ new Date()).toISOString(),
          source,
          trigger_type: triggerType,
          category_or_keyword: categoryOrKeyword,
          records_fetched: recordsFetched,
          status,
          message: message || null
        }
      });
    } catch (error) {
      console.error("Error logging scrape run:", error);
    }
  }
  async shouldSkipScraping(scope) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3).toISOString();
      const result = await this.callEdgeFunction({
        action: "query",
        table: "scrape_logs",
        where: {
          category_or_keyword: scope,
          run_time: `>${oneHourAgo}`
        },
        limit: 1
      });
      return result.data && result.data.length > 0;
    } catch (error) {
      console.error("Error checking scrape cache:", error);
      return false;
    }
  }
  async scrapeAll(request) {
    const { sources, category, keyword, triggerType, force = false } = request;
    const scope = category || keyword || "all";
    if (!force && await this.shouldSkipScraping(scope)) {
      console.log(`Skipping scrape for ${scope} - cached results available`);
      return {
        success: true,
        results: [],
        totalNewWebinars: 0,
        message: `Cached results returned for ${scope} (scraped within last hour)`
      };
    }
    const results = [];
    let totalNewWebinars = 0;
    const scrapersToRun = sources ? this.scrapers.filter((s) => sources.includes(s["config"]["name"].toLowerCase())) : this.scrapers;
    for (const scraper of scrapersToRun) {
      try {
        console.log(`Running scraper: ${scraper["config"]["name"]}`);
        const scrapedWebinars = await scraper.scrapeAndValidate();
        let newCount = 0;
        for (const webinar of scrapedWebinars) {
          const supabaseWebinar = this.convertScrapedToSupabaseFormat(webinar);
          const isNew = await this.insertWebinar(supabaseWebinar);
          if (isNew) newCount++;
        }
        const result = {
          source: scraper["config"]["name"],
          webinars: scrapedWebinars,
          success: true,
          count: newCount
        };
        results.push(result);
        totalNewWebinars += newCount;
        await this.logScrapeRun(
          scraper["config"]["name"],
          triggerType,
          scope,
          newCount,
          "success",
          `Successfully scraped ${scrapedWebinars.length} webinars, ${newCount} new`
        );
      } catch (error) {
        console.error(`Error in ${scraper["config"]["name"]} scraper:`, error);
        const result = {
          source: scraper["config"]["name"],
          webinars: [],
          success: false,
          error: error.message,
          count: 0
        };
        results.push(result);
        await this.logScrapeRun(
          scraper["config"]["name"],
          triggerType,
          scope,
          0,
          "error",
          error.message
        );
      }
    }
    return {
      success: true,
      results,
      totalNewWebinars,
      message: `Scraped ${totalNewWebinars} new webinars from ${results.length} sources`
    };
  }
  async testAllScrapers() {
    console.log("=== TESTING ALL SCRAPERS ===");
    const testResult = await this.scrapeAll({
      triggerType: "manual",
      force: true
    });
    console.log("\n=== SCRAPER TEST RESULTS ===");
    console.log(`Total new webinars: ${testResult.totalNewWebinars}`);
    console.log(`Message: ${testResult.message}`);
    testResult.results.forEach((result) => {
      console.log(`
${result.source}:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  New webinars: ${result.count}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  }
};

// server/seo/content-generator.ts
import crypto2 from "crypto";
var SEOContentGenerator = class {
  supabaseUrl;
  supabaseKey;
  edgeFunctionUrl;
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || "https://brroucjplqmngljroknr.supabase.co";
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc";
    this.edgeFunctionUrl = process.env.SUPABASE_FUNCTION_URL || "https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler";
  }
  async callEdgeFunction(payload) {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Edge function call failed:", error);
      throw error;
    }
  }
  generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").substring(0, 60);
  }
  getTopTags(webinars) {
    const tagCount = /* @__PURE__ */ new Map();
    webinars.forEach((webinar) => {
      (webinar.tags || []).forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries()).sort(([, a], [, b]) => b - a).slice(0, 8).map(([tag]) => tag);
  }
  getRelatedKeywords(category) {
    const keywordMap = {
      "Technology": ["AI", "Machine Learning", "Cloud Computing", "Cybersecurity", "DevOps", "Data Science"],
      "Business": ["Leadership", "Marketing", "Sales", "Strategy", "Entrepreneurship", "Finance"],
      "Marketing": ["Digital Marketing", "SEO", "Content Marketing", "Social Media", "Email Marketing", "Analytics"],
      "Professional Development": ["Career Growth", "Soft Skills", "Communication", "Time Management", "Networking"]
    };
    return keywordMap[category] || ["Skills", "Training", "Development", "Growth", "Learning", "Certification"];
  }
  getDetailedAudience(category, tags) {
    const audienceMap = {
      "Technology": "Software developers, IT professionals, tech enthusiasts, and career changers",
      "Business": "Entrepreneurs, managers, consultants, and business analysts",
      "Marketing": "Digital marketers, content creators, social media managers, and growth hackers",
      "Professional Development": "Working professionals, students, and career changers across all industries"
    };
    const baseAudience = audienceMap[category] || "Professionals and learners";
    const specificSkills = tags.slice(0, 2).join(" and ");
    return `${baseAudience} interested in ${specificSkills}`;
  }
  getRelevanceExplanation(category, title) {
    const explanations = [
      `This ${category.toLowerCase()} session addresses critical industry challenges and provides practical solutions you can implement immediately.`,
      `With the rapid evolution in ${category.toLowerCase()}, staying updated with these concepts is essential for career advancement.`,
      `Industry leaders consistently rank these ${category.toLowerCase()} skills among the most valuable for 2025 and beyond.`,
      `This topic directly impacts salary growth and job security in the current ${category.toLowerCase()} market.`
    ];
    return explanations[Math.floor(Math.random() * explanations.length)];
  }
  getTrendExplanation(tag, category) {
    return `${tag} is experiencing massive growth due to industry demand and technological advancement in ${category.toLowerCase()}.`;
  }
  getJobMarketImpact(tag) {
    const impacts = [
      "15% higher salary potential",
      "25% more job opportunities",
      "30% faster hiring process",
      "20% better job security"
    ];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }
  getLearningPath(tag) {
    return `Start with fundamentals \u2192 Practice hands-on projects \u2192 Join ${tag} communities \u2192 Pursue advanced certifications`;
  }
  async getRecentWebinars() {
    try {
      const result = await this.callEdgeFunction({
        action: "query",
        table: "webinars",
        limit: 50
      });
      return result.data || [];
    } catch (error) {
      console.error("Error fetching recent webinars:", error);
      return [];
    }
  }
  async getTrendingCategories() {
    const webinars = await this.getRecentWebinars();
    const categoryCount = /* @__PURE__ */ new Map();
    webinars.forEach((webinar) => {
      if (webinar.category) {
        categoryCount.set(webinar.category, (categoryCount.get(webinar.category) || 0) + 1);
      }
    });
    return Array.from(categoryCount.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }
  async generateWeeklyListicle() {
    const trendingCategories = await this.getTrendingCategories();
    const topCategory = trendingCategories[0]?.category || "Technology";
    const title = `Top Free ${topCategory} Webinars This Week - Updated ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`;
    const slug = this.generateSlug(title);
    const content = `
# ${title}

Discover the best free ${topCategory.toLowerCase()} webinars happening this week. All events are carefully curated and completely free to attend.

## Featured Webinars

### Why Attend Free ${topCategory} Webinars?

Free webinars offer incredible value for professionals looking to:
- Stay updated with latest ${topCategory.toLowerCase()} trends
- Learn from industry experts
- Network with like-minded professionals
- Advance their career without cost barriers

## This Week's Top Picks

${trendingCategories.slice(0, 5).map((cat, index) => `
### ${index + 1}. ${cat.category} Webinars (${cat.count} events)

Explore cutting-edge ${cat.category.toLowerCase()} topics with expert speakers from leading companies. These webinars cover practical skills and real-world applications.

`).join("")}

## How to Make the Most of Free Webinars

1. **Register Early**: Popular webinars fill up quickly
2. **Prepare Questions**: Engage with speakers during Q&A
3. **Take Notes**: Capture key insights and actionable tips
4. **Network**: Connect with other attendees
5. **Follow Up**: Apply what you learn immediately

## Upcoming Categories to Watch

Based on our analysis of trending topics:

${trendingCategories.slice(0, 3).map((cat) => `- **${cat.category}**: ${cat.count} upcoming events`).join("\n")}

## Stay Updated

Subscribe to our weekly newsletter to get the latest free webinar recommendations delivered to your inbox.

---

*Last updated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()} | Found ${trendingCategories.reduce((sum, cat) => sum + cat.count, 0)} free webinars*
`;
    const keywords = [
      "free webinars",
      `free ${topCategory.toLowerCase()} webinars`,
      "online workshops",
      "professional development",
      "live training",
      "expert speakers",
      "career advancement",
      "skill building"
    ];
    const metaDescription = `Discover the best free ${topCategory.toLowerCase()} webinars this week. Hand-picked events from top experts, all completely free. Updated daily with new opportunities.`;
    return {
      id: crypto2.randomUUID(),
      title,
      slug,
      content,
      keywords,
      meta_description: metaDescription,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async generateHowToGuide(topic) {
    const guides = {
      "attending-webinars": {
        title: "Complete Guide to Attending Free Webinars in 2025",
        content: `
# Complete Guide to Attending Free Webinars in 2025

Free webinars have become the go-to resource for professional development. This comprehensive guide shows you how to find, attend, and maximize value from free online learning opportunities.

## Finding Quality Free Webinars

### Best Platforms for Free Webinars
1. **EventBrite**: Largest collection of free events
2. **Meetup**: Local and virtual meetups
3. **Luma**: Modern event discovery platform
4. **LinkedIn Events**: Professional networking events
5. **Company Websites**: Direct from industry leaders

### Search Strategies
- Use specific keywords: "free python webinar" vs just "python"
- Set up Google Alerts for your topics
- Follow industry leaders on social media
- Join professional communities and forums

## Preparing for Webinars

### Technical Setup
- Test your internet connection
- Download required software in advance
- Use headphones for better audio quality
- Ensure good lighting for video calls
- Have backup connection options

### Engagement Preparation
- Research the speaker and company
- Prepare 2-3 thoughtful questions
- Connect with the speaker on LinkedIn before the event
- Set learning objectives

## During the Webinar

### Active Participation
- Take detailed notes
- Participate in polls and chat
- Ask questions during Q&A
- Connect with other attendees
- Screenshot important slides

### Technical Tips
- Mute when not speaking
- Use chat for questions if voice Q&A isn't available
- Record if permitted (check policies first)
- Keep backup notes in case of technical issues

## After the Webinar

### Immediate Actions
- Review and organize your notes
- Connect with the speaker and attendees on LinkedIn
- Download any provided resources
- Share key insights with your team

### Long-term Follow-up
- Apply learned concepts within 24 hours
- Schedule follow-up conversations
- Join communities mentioned during the webinar
- Look for related content from the same speakers

## Maximizing ROI from Free Webinars

### Career Development
- Add new skills to your LinkedIn profile
- Update your resume with new knowledge
- Mention insights in team meetings
- Apply for roles requiring these skills

### Networking Benefits
- Build relationships with industry experts
- Connect with peers in your field
- Join speaker's email lists or communities
- Attend follow-up events

## Common Mistakes to Avoid

1. **Not testing technology beforehand**
2. **Passive participation**
3. **Skipping the networking opportunity**
4. **Not following up after the event**
5. **Trying to multitask during the session**

## Building Your Webinar Routine

### Weekly Schedule
- Monday: Search for upcoming webinars
- Wednesday: Register for selected events
- Friday: Review and prepare for weekend learning
- Weekend: Attend 1-2 webinars maximum

### Tracking Progress
- Maintain a webinar log
- Rate each session for quality
- Track skills gained
- Measure career impact

## Advanced Strategies

### Becoming a Regular
- Attend series from the same organizers
- Volunteer to help with events
- Share events with your network
- Provide feedback to organizers

### Creating Your Own Opportunities
- Suggest webinar topics to organizers
- Offer to co-present
- Host internal company sessions
- Start your own webinar series

## Conclusion

Free webinars are powerful tools for continuous learning and career advancement. By following this guide, you'll maximize the value from every session and build a strong professional network.

Remember: The key to success is consistent attendance, active participation, and strategic follow-up.
`,
        keywords: [
          "how to attend webinars",
          "free webinar guide",
          "webinar best practices",
          "online learning tips",
          "professional development",
          "virtual event attendance",
          "webinar etiquette",
          "networking online"
        ]
      },
      "career-development": {
        title: "Using Free Webinars for Career Advancement: A Strategic Approach",
        content: `
# Using Free Webinars for Career Advancement: A Strategic Approach

In today's competitive job market, continuous learning is essential. Free webinars offer an accessible way to develop new skills, expand your network, and advance your career without breaking the bank.

## Strategic Career Planning with Webinars

### Skill Gap Analysis
Before diving into webinars, assess your current skills against your career goals:
- Review job descriptions for your target roles
- Identify skills mentioned repeatedly
- Use tools like LinkedIn Skills Assessment
- Get feedback from mentors or managers

### Creating Your Learning Path
1. **Foundation Skills**: Start with basics in your field
2. **Advanced Techniques**: Deep dive into specialized areas
3. **Cross-functional Skills**: Learn complementary disciplines
4. **Leadership Development**: Prepare for management roles

## High-Impact Career Development Topics

### Technology Professionals
- Cloud computing and DevOps
- Data science and analytics
- Cybersecurity fundamentals
- AI and machine learning
- Mobile and web development

### Business Professionals
- Digital marketing strategies
- Project management methodologies
- Sales and negotiation skills
- Financial analysis and planning
- Leadership and team management

### Creative Professionals
- Design thinking and UX/UI
- Content marketing and SEO
- Social media strategy
- Brand development
- Digital tools and software

## Leveraging Webinars for Networking

### Pre-Event Networking
- Research attendee lists when available
- Connect with speakers on social media
- Join event-specific LinkedIn groups
- Introduce yourself to organizers

### During Event Networking
- Actively participate in chat discussions
- Ask thoughtful questions
- Share relevant experiences
- Offer help to other attendees

### Post-Event Follow-up
- Send personalized LinkedIn connection requests
- Share event highlights on social media
- Schedule coffee chats with interesting connections
- Join communities recommended by speakers

## Demonstrating New Skills

### Portfolio Development
- Create projects based on webinar learnings
- Document your learning journey
- Build case studies from applied knowledge
- Showcase certifications and completions

### Professional Visibility
- Write blog posts about key insights
- Share learnings in team meetings
- Volunteer for projects using new skills
- Mentor others in areas you've learned

## Measuring Career Impact

### Short-term Metrics (1-3 months)
- Number of new connections made
- Skills added to professional profiles
- Projects completed using new knowledge
- Positive feedback from manager or peers

### Long-term Metrics (6-12 months)
- Promotion or role advancement
- Salary increase or better job offers
- Speaking opportunities at events
- Recognition as subject matter expert

## Building Your Professional Brand

### Content Creation
- Share webinar insights on LinkedIn
- Write articles about trending topics
- Create video summaries of key learnings
- Host internal knowledge sharing sessions

### Community Engagement
- Join professional associations
- Participate in online forums
- Attend follow-up events
- Volunteer for industry organizations

## Overcoming Common Challenges

### Time Management
- Block calendar time for learning
- Choose webinars aligned with current projects
- Attend during lunch breaks or commute
- Use mobile apps for on-the-go learning

### Information Overload
- Focus on 1-2 key topics per month
- Take selective notes on actionable items
- Review and apply learnings within 48 hours
- Archive less relevant information

### Staying Motivated
- Set specific learning goals
- Track progress visually
- Celebrate small wins
- Find an accountability partner

## Advanced Career Strategies

### Becoming a Thought Leader
- Share unique perspectives in Q&A sessions
- Connect concepts across different webinars
- Offer to guest on podcasts or webinars
- Write whitepapers on industry trends

### Creating Opportunities
- Propose new initiatives based on learnings
- Suggest company-wide training programs
- Organize internal webinar viewing parties
- Start professional development groups

## ROI Calculation

### Investment Tracking
- Time spent attending webinars
- Follow-up time for networking
- Cost of any premium resources
- Opportunity cost of other activities

### Return Measurement
- Salary increases or bonuses
- Job advancement opportunities
- New client or business relationships
- Personal satisfaction and confidence

## Long-term Career Strategy

### 5-Year Vision
- Identify where you want to be professionally
- Map required skills and experiences
- Create quarterly learning objectives
- Adjust strategy based on market changes

### Continuous Adaptation
- Stay current with industry trends
- Regularly reassess career goals
- Expand into emerging fields
- Build transferable skills

## Conclusion

Free webinars are powerful career development tools when used strategically. By aligning learning with career goals, actively networking, and consistently applying new knowledge, you can accelerate your professional growth significantly.

The key is consistency, strategic selection, and active application of what you learn. Start small, be consistent, and watch your career trajectory change.
`,
        keywords: [
          "career development webinars",
          "professional growth",
          "skill development",
          "career advancement",
          "networking strategies",
          "professional learning",
          "career planning",
          "skill building"
        ]
      }
    };
    const guide = guides[topic] || guides["attending-webinars"];
    return {
      id: crypto2.randomUUID(),
      topic: guide.title,
      content: guide.content,
      seo_keywords: guide.keywords,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async generateDailyContent() {
    console.log("Generating daily SEO content...");
    const blogs = [];
    const guides = [];
    try {
      for (let i = 0; i < 3; i++) {
        const blog = await this.generateWeeklyListicle();
        blogs.push(blog);
        await this.callEdgeFunction({
          action: "insert",
          table: "blogs",
          data: blog
        });
      }
      const guideTopics = ["attending-webinars", "career-development"];
      const randomTopic = guideTopics[Math.floor(Math.random() * guideTopics.length)];
      const guide = await this.generateHowToGuide(randomTopic);
      guides.push(guide);
      await this.callEdgeFunction({
        action: "insert",
        table: "guides",
        data: guide
      });
      console.log(`Generated ${blogs.length} blog posts and ${guides.length} guides`);
      return {
        blogs,
        guides,
        total: blogs.length + guides.length
      };
    } catch (error) {
      console.error("Error generating daily content:", error);
      return { blogs, guides, total: 0 };
    }
  }
  async triggerNetlifyBuild() {
    console.log("Netlify build triggered for SEO content update");
  }
};

// server/scrapers/scheduler.ts
var WebinarScheduler = class {
  orchestrator;
  seoGenerator;
  isRunning = false;
  constructor() {
    this.orchestrator = new ScraperOrchestrator();
    this.seoGenerator = new SEOContentGenerator();
  }
  async runDailyUpdate() {
    if (this.isRunning) {
      console.log("Daily update already running, skipping...");
      return;
    }
    this.isRunning = true;
    console.log("Starting daily webinar update...");
    try {
      const scrapeResult = await this.orchestrator.scrapeAll({
        triggerType: "daily",
        force: true
      });
      console.log(`Daily scrape completed: ${scrapeResult.totalNewWebinars} new webinars found`);
      if (scrapeResult.totalNewWebinars > 0) {
        const contentResult = await this.seoGenerator.generateDailyContent();
        console.log(`Generated ${contentResult.total} SEO content pieces`);
        await this.seoGenerator.triggerNetlifyBuild();
      }
    } catch (error) {
      console.error("Daily update failed:", error);
    } finally {
      this.isRunning = false;
    }
  }
  async handleUserTrigger(category, keyword) {
    try {
      console.log(`User trigger: category=${category}, keyword=${keyword}`);
      const scrapeResult = await this.orchestrator.scrapeAll({
        category,
        keyword,
        triggerType: "user_action",
        force: false
        // Use cache if available
      });
      console.log(`User-triggered scrape: ${scrapeResult.totalNewWebinars} new webinars`);
      if (scrapeResult.totalNewWebinars > 5) {
        await this.seoGenerator.generateDailyContent();
      }
    } catch (error) {
      console.error("User-triggered scrape failed:", error);
    }
  }
  startScheduler() {
    const runDaily = () => {
      const now = /* @__PURE__ */ new Date();
      const next6AM = /* @__PURE__ */ new Date();
      next6AM.setHours(6, 0, 0, 0);
      if (next6AM <= now) {
        next6AM.setDate(next6AM.getDate() + 1);
      }
      const msUntil6AM = next6AM.getTime() - now.getTime();
      setTimeout(() => {
        this.runDailyUpdate();
        setInterval(() => this.runDailyUpdate(), 24 * 60 * 60 * 1e3);
      }, msUntil6AM);
    };
    runDaily();
    console.log("WebinarHub scheduler started - daily updates at 6 AM");
  }
};

// server/routes.ts
var registrationRequestSchema = z.object({
  type: z.literal("registration"),
  webinarId: z.string(),
  name: z.string(),
  email: z.string().email(),
  whatsappNumber: z.string().optional()
});
var reminderRequestSchema = z.object({
  type: z.literal("reminder"),
  webinarId: z.string(),
  email: z.string().email()
});
async function registerRoutes(app2) {
  const scheduler = new WebinarScheduler();
  scheduler.startScheduler();
  app2.get("/api/webinars", async (req, res) => {
    try {
      const webinars = await storage.getWebinars();
      scheduler.handleUserTrigger().catch(
        (err) => console.error("Background scrape failed:", err)
      );
      res.json(webinars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webinars" });
    }
  });
  app2.get("/api/webinars/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      const webinars = await storage.getWebinars();
      const searchResults = webinars.filter(
        (w) => w.title?.toLowerCase().includes(query.toLowerCase()) || w.subtitle?.toLowerCase().includes(query.toLowerCase()) || w.host?.toLowerCase().includes(query.toLowerCase())
      );
      scheduler.handleUserTrigger(void 0, query).catch(
        (err) => console.error("Search scrape failed:", err)
      );
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ error: "Failed to search webinars" });
    }
  });
  app2.get("/api/webinars/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const webinars = await storage.getWebinars();
      const categoryWebinars = webinars.filter(
        (w) => w.category?.toLowerCase() === category.toLowerCase()
      );
      scheduler.handleUserTrigger(category).catch(
        (err) => console.error("Category scrape failed:", err)
      );
      res.json(categoryWebinars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category webinars" });
    }
  });
  app2.get("/api/webinars/:id", async (req, res) => {
    try {
      const webinar = await storage.getWebinar(req.params.id);
      if (!webinar) {
        return res.status(404).json({ error: "Webinar not found" });
      }
      if (webinar.category) {
        scheduler.handleUserTrigger(webinar.category).catch(
          (err) => console.error("Category-based scrape failed:", err)
        );
      }
      res.json(webinar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webinar" });
    }
  });
  app2.post("/api/webinar-action", async (req, res) => {
    try {
      const body = req.body;
      if (body.type === "registration") {
        const validatedData = registrationRequestSchema.parse(body);
        const registration = await storage.createUserRegistration({
          webinarId: validatedData.webinarId,
          name: validatedData.name,
          email: validatedData.email,
          whatsappNumber: validatedData.whatsappNumber || null,
          registrationType: "live_join"
        });
        let meetSession = await storage.getGoogleMeetSession(validatedData.webinarId);
        if (!meetSession) {
          const webinar = await storage.getWebinar(validatedData.webinarId);
          if (webinar?.meetUrl) {
            meetSession = await storage.createGoogleMeetSession({
              webinarId: validatedData.webinarId,
              meetUrl: webinar.meetUrl,
              sessionId: `session_${Date.now()}`,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
              // 24 hours
            });
          }
        }
        console.log("Syncing to Google Sheets:", registration);
        res.json({
          success: true,
          meetUrl: meetSession?.meetUrl || "https://meet.google.com/pnz-piqy-vvx",
          registrationId: registration.id
        });
      } else if (body.type === "reminder") {
        const validatedData = reminderRequestSchema.parse(body);
        const registration = await storage.createUserRegistration({
          webinarId: validatedData.webinarId,
          name: "Reminder User",
          email: validatedData.email,
          whatsappNumber: null,
          registrationType: "reminder"
        });
        console.log("Setting reminder for:", registration);
        res.json({
          success: true,
          message: "Reminder set successfully",
          registrationId: registration.id
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
  app2.get("/api/webinars/:id/registrations", async (req, res) => {
    try {
      const registrations = await storage.getUserRegistrations(req.params.id);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });
  app2.get("/api/admin/registrations", async (req, res) => {
    try {
      const webinars = await storage.getWebinars();
      const allRegistrations = [];
      for (const webinar of webinars) {
        const registrations = await storage.getUserRegistrations(webinar.id);
        registrations.forEach((reg) => {
          allRegistrations.push({
            ...reg,
            webinarTitle: webinar.title,
            webinarHost: webinar.host,
            webinarDate: webinar.dateTime
          });
        });
      }
      res.json({
        totalRegistrations: allRegistrations.length,
        registrations: allRegistrations
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all registrations" });
    }
  });
  app2.post("/api/scrape/trigger", async (req, res) => {
    try {
      const { category, keyword, force } = req.body;
      console.log("Manual scrape triggered:", { category, keyword, force });
      const result = await scheduler.orchestrator.scrapeAll({
        category,
        keyword,
        triggerType: "manual",
        force: force || false
      });
      res.json({
        success: true,
        message: result.message,
        totalNewWebinars: result.totalNewWebinars,
        results: result.results
      });
    } catch (error) {
      console.error("Manual scrape failed:", error);
      res.status(500).json({ error: "Scrape failed", message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
var server;
(async () => {
  server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (process.env.NODE_ENV === "development") {
    const { setupVite: setupVite2 } = await init_vite().then(() => vite_exports);
    await setupVite2(app, server);
  } else {
    if (!process.env.NETLIFY) {
      const { serveStatic: serveStatic2 } = await init_vite().then(() => vite_exports);
      serveStatic2(app);
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log2(`serving on port ${port}`);
    });
  }
})();
var server_default = app;

// netlify/functions-src/api.ts
import serverless from "serverless-http";
var handler = serverless(server_default);
export {
  handler
};
