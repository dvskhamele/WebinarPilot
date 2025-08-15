import http from "http";
import app, { appReady } from "./app";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

let server: http.Server;

(async () => {
  await appReady;
  server = http.createServer(app);

  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    if (!process.env.NETLIFY) {
      const { serveStatic } = await import("./vite");
      serveStatic(app);
    }
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`API server running on port ${port}`);
    if (process.env.NODE_ENV === 'development') {
      log(`Vite dev server should be running on 5173`);
    }
  });
})();

export default app;
