#!/usr/bin/env node
// Minimal mock Ollama-compatible HTTP server for local-first testing.
// Responds to GET /api/models and POST /api/chat.
const http = require("http");

const PORT = process.env.MOCK_OLLAMA_PORT ? Number(process.env.MOCK_OLLAMA_PORT) : 11434;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/models") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ models: ["qwen2.5-coder:7b"] }));
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        // return a simple JSON payload in the message.content field
        const reply = {
          message: {
            content: JSON.stringify({
              headline: "Mock summary headline",
              summary: "This is a mock summary produced by the local Ollama mock.",
              priorities: ["Check local mock", "Fallback active", "Verify feeds"],
            }),
          },
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(reply));
      } catch (e) {
        res.writeHead(500);
        res.end("{}");
      }
    });

    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Mock Ollama listening on http://localhost:${PORT}`);
});
