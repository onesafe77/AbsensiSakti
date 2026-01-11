import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

// EMERGENCY DEBUG ROUTE - DELETE TNA
app.post("/api/hse/tna/delete-entry", async (req, res) => {
  try {
    console.log("EMERGENCY ROUTE HIT:", req.body);
    if (!req.body.id) return res.status(400).json({ error: "No ID" });
    const success = await storage.deleteTnaEntry(req.body.id);
    if (!success) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, method: "emergency" });
  } catch (e: any) {
    console.error("EMERGENCY ROUTE ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

console.log("SERVER RESTARTING... UPDATED ROUTES LOADING...");


// Enable compression for better performance
app.use(compression({
  level: 6, // Compression level (1-9, 6 is default)
  threshold: 1024, // Only compress if response is larger than this
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
// Increase body size limit to handle large Excel uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize cron jobs for leave monitoring
  const { initializeCronJobs } = await import('./cronJobs');
  initializeCronJobs();

  // Serve static files from uploads folder (for meeting photos, P5M photos, etc.)
  app.use('/uploads', express.static('uploads'));
  // Explicitly serve public folder (for standalone HTML dashboards)
  app.use(express.static('public'));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Global error handler:", err);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  console.log('DEBUG: process.env.PORT is:', process.env.PORT);
  const port = parseInt(process.env.PORT || '5004', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
