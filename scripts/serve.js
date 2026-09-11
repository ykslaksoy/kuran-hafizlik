#!/usr/bin/env node
/**
 * Zero-dependency static server for the recovered Expo web export in dist/.
 * SPA fallback: unknown paths serve index.html (same as the live site).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const full = path.normalize(path.join(root, rel));
  if (!full.startsWith(root)) return null;
  return full;
}

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }
  const target = safeJoin(ROOT, req.url || "/");
  if (!target) {
    send(res, 400, "Bad Request");
    return;
  }
  let file = target;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }
  const exists = fs.existsSync(file) && fs.statSync(file).isFile();
  if (!exists) {
    file = path.join(ROOT, "index.html");
  }
  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || "application/octet-stream";
  fs.readFile(file, (err, buf) => {
    if (err) {
      send(res, 500, "Internal Server Error");
      return;
    }
    send(res, 200, req.method === "HEAD" ? undefined : buf, {
      "Content-Type": type,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Hafız Yol export → http://${HOST}:${PORT}/  (dist/)`);
});
