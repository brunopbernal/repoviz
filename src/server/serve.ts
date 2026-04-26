import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { readBundleAssets, generateHTML } from "../bundler/bundle.js";

export async function startServer(
  graphPath: string,
  port: number,
  noOpen: boolean,
  quiet: boolean
): Promise<void> {
  const assets = readBundleAssets(graphPath);
  const html = generateHTML(assets.graphData, assets.viewerBundleJS, assets.templateHTML);
  const htmlBuffer = Buffer.from(html, "utf8");

  const server = createServer((_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": htmlBuffer.length,
    });
    res.end(htmlBuffer);
  });

  // Start listening and wait for server to be ready
  await new Promise<void>((ok, fail) => {
    server.on("error", fail);
    server.listen(port, "127.0.0.1", () => {
      const addr = server.address();
      const actualPort =
        addr && typeof addr === "object" ? addr.port : port;
      const url = `http://localhost:${actualPort}`;

      if (!quiet) {
        process.stderr.write(`repoviz visualizer running at ${url}\n`);
        process.stderr.write(`Press Ctrl+C to stop.\n`);
      } else {
        process.stderr.write(`${url}\n`);
      }

      if (!noOpen) {
        import("open")
          .then(({ default: open }) => open(url))
          .catch(() => undefined);
      }

      ok();
    });
  });

  // Block until SIGINT
  await new Promise<void>((done) => {
    process.on("SIGINT", () => {
      server.close(() => done());
    });
  });
}
