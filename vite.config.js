import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const injectServiceWorkerAssets = () => ({
  name: "weatherboard-service-worker-precache",
  apply: "build",
  closeBundle() {
    const outputDir = path.resolve("dist");
    const serviceWorkerPath = path.join(outputDir, "sw.js");
    const source = fs.readFileSync(serviceWorkerPath, "utf8");
    const assets = fs
      .readdirSync(path.join(outputDir, "assets"))
      .filter((file) => /\.(js|css)$/.test(file))
      .map((file) => `/assets/${file}`);
    const shell = [
      "/",
      "/index.html",
      "/manifest.webmanifest",
      "/icons/weatherboard.svg",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      ...assets,
    ];
    const cacheVersion = assets.join("-").replace(/[^a-zA-Z0-9_-]/g, "_");
    const withCacheVersion = source.replace(
      'const CACHE = "__WB_CACHE__";',
      `const CACHE = ${JSON.stringify(`weatherboard-shell-${cacheVersion}`)};`,
    );
    const updated = withCacheVersion.replace(
      'const SHELL = "__WB_PRECACHE__";',
      `const SHELL = ${JSON.stringify(shell)};`,
    );
    if (
      updated === source ||
      updated.includes("__WB_CACHE__") ||
      updated.includes("__WB_PRECACHE__")
    ) {
      throw new Error("Service worker precache marker was not found.");
    }
    fs.writeFileSync(serviceWorkerPath, updated);
  },
});

export default defineConfig({
  plugins: [react(), injectServiceWorkerAssets()],
});
