import { PhyloidApp } from "./ui/app.js";

const container = document.getElementById("app");
if (!container) throw new Error("Missing #app container");

const app = new PhyloidApp();
app.init(container);

// Expose for debugging
(window as unknown as Record<string, unknown>).phyloid = app;
