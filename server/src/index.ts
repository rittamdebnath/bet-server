import { cors } from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { auth } from "./lib/auth";
import { subscriptionController } from "./controller/subscription";

// Database migration with enhanced logging
// console.log("🔧 Starting database migration...");
// console.log(`📅 Migration started at: ${new Date().toISOString()}`);

// const migrationStartTime = performance.now();

// try {
// 	await migrate(db, {
// 		migrationsFolder: "./src/db/migrations",
// 	});

// 	const migrationEndTime = performance.now();
// 	const migrationDuration = ((migrationEndTime - migrationStartTime) / 1000).toFixed(2);

// 	console.log("✅ Database migration completed successfully!");
// 	console.log(`⏱️  Migration took: ${migrationDuration}s`);
// 	console.log(`📅 Migration completed at: ${new Date().toISOString()}`);
// 	console.log("=============================================");
// } catch (error) {
// 	const migrationEndTime = performance.now();
// 	const migrationDuration = ((migrationEndTime - migrationStartTime) / 1000).toFixed(2);

// 	console.error("❌ Database migration failed!");
// 	console.error(`⏱️  Migration failed after: ${migrationDuration}s`);
// 	console.error("🔍 Error details:", error);
// 	console.log(`📅 Migration failed at: ${new Date().toISOString()}`);

// 	// Exit the process if migration fails
// 	process.exit(1);
// }

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Org-slug"],
      credentials: true,
    })
  )
  .use(swagger())
  .get("/api/auth/reference", ({ request, set }) => {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization");

    // Check if Authorization header exists and starts with "Basic "
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      set.status = 401;
      set.headers["WWW-Authenticate"] = 'Basic realm="Authentication Required"';
      return { error: "Authentication required" };
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(":");

    // Check credentials (replace with your actual authentication logic)
    if (
      username !== process.env.BASIC_AUTH_USERNAME ||
      password !== process.env.BASIC_AUTH_PASSWORD
    ) {
      set.status = 401;
      return { error: "Invalid credentials" };
    }

    // If authentication successful, proceed with the original handler
    return auth.handler(request);
  })
  .all("/api/auth/*", async ({ request, status }) => {
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    status(405);
  })
  .derive(({ server, request }) => ({
    ip: server?.requestIP(request),
  }))
  .use(subscriptionController)
  .get("/", ({ ip }) => ({
    message: "OK",
    ip: ip?.address || "Unknown IP",
  }))
  .get("/api/status", ({ ip }) => {
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);

    return {
      status: "healthy",
      message: "Server is running successfully",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
      },
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: "connected",
        auth: "active",
        email: "configured",
      },
      ip: ip?.address || "Unknown IP",
    };
  })
  .get("/error", ({ status }) => {
    return status(500, {
      error: "This is a test error",
      message: "An error occurred",
    });
  })
  .listen(3006, () => {
    console.log("🦊 Elysia Server is running on http://localhost:3006");
    console.log(
      "📚 Swagger docs are available at http://localhost:3006/swagger"
    );
    console.log(
      "🔑 Auth reference is available at http://localhost:3006/api/auth/reference"
    );
  });
