import { createServer } from "node:http";

const port = 4317;
const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }
  if (url.pathname !== "/v1/search") {
    response.writeHead(404).end();
    return;
  }
  const query = url.searchParams.get("name")?.toLowerCase() ?? "";
  const results = query.includes("cedar rapids") ? [{ id: 4850751, name: "Cedar Rapids", admin1: "Iowa", country: "United States", timezone: "America/Chicago", latitude: 41.9779, longitude: -91.6656 }] : [];
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ results }));
});

server.listen(port, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
