import app from "../src/app";

// Vercel treats a default-exported Express app as a serverless function handler.
// Every request matching vercel.json's rewrite (see vercel.json) is routed here.
export default app;
