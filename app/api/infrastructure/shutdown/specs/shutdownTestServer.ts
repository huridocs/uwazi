import http, { IncomingMessage, Server } from 'http';
import net, { AddressInfo } from 'net';
import express, { Application } from 'express';
import { HttpServerGracefulShutdown } from '../HttpServerGracefulShutdown.js';

const sleep = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

async function httpGet(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    // A fresh socket, so a reset is this request and not a pooled keep-alive.
    const req = http.get(url, { agent: false }, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode!, body: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

interface TestContext {
  app: Application;
  server: Server;
  shutdown: HttpServerGracefulShutdown;
  exitCalls: number[];
  loggerCalls: { log: unknown[][]; error: unknown[][] };
  cleanupCalls: string[];
  _baseUrl: string | null;
  url(): string;
}

interface HeldSocket {
  socket?: net.Socket;
}

function createTestServer({
  delay = 50,
  timeout = 500,
  // eslint-disable-next-line no-empty-function
  closeSockets = () => {},
} = {}): TestContext {
  const app = express();
  const server = http.createServer(app);

  const exitCalls: number[] = [];
  const loggerCalls = { log: [] as unknown[][], error: [] as unknown[][] };
  const cleanupCalls: string[] = [];

  const shutdown = new HttpServerGracefulShutdown({
    server,
    app,
    cleanup: async () => {
      cleanupCalls.push('cleanup');
    },
    closeSockets,
    timeout,
    exit: code => {
      exitCalls.push(code);
    },
    logger: {
      info: (...args: unknown[]) => {
        loggerCalls.log.push(args);
      },
      warning: (...args: unknown[]) => {
        loggerCalls.log.push(args);
      },
      error: (...args: unknown[]) => {
        loggerCalls.error.push(args);
      },
      // eslint-disable-next-line no-empty-function
      debug: () => {},
      // eslint-disable-next-line no-empty-function
      critical: () => {},
    },
  });

  app.get('/slow', (_req, res) => {
    setTimeout(() => {
      res.json({ ok: true });
    }, delay);
  });

  app.get('/fast', (_req, res) => {
    res.json({ ok: true });
  });

  const ctx: TestContext = {
    app,
    server,
    shutdown,
    exitCalls,
    loggerCalls,
    cleanupCalls,
    _baseUrl: null,
    url() {
      return this._baseUrl!;
    },
  };

  return ctx;
}

async function startServer(ctx: TestContext): Promise<string> {
  return new Promise(resolve => {
    ctx.server.listen(0, () => {
      const url = `http://localhost:${(ctx.server.address() as AddressInfo).port}`;
      resolve(url);
    });
  });
}

function stopServer(ctx: TestContext): void {
  try {
    ctx.server.closeAllConnections?.();
  } catch {
    // server may already be closed
  }
  ctx.server.close();
}

async function openSocket(ctx: TestContext): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect((ctx.server.address() as AddressInfo).port, '127.0.0.1', () => {
      resolve(socket);
    });
    socket.on('error', reject);
  });
}

async function sendHttpRequest(socket: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.write('GET /fast HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
    let data = '';
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('timeout'));
    }, 1000);
    socket.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    socket.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    socket.on('error', (err: Error) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Resolves once `count` requests have been dispatched. Shutdown before that
// can reset a socket that is connected but not yet inside a request.
async function whenRequestsReceived(server: Server, count: number): Promise<void> {
  await new Promise<void>(resolve => {
    let received = 0;
    const onRequest = () => {
      received += 1;
      if (received < count) {
        return;
      }
      server.removeListener('request', onRequest);
      resolve();
    };
    server.on('request', onRequest);
  });
}

async function listenWithCloser(closeSockets: () => void): Promise<TestContext> {
  const ctx = createTestServer({ closeSockets });
  ctx._baseUrl = await startServer(ctx);
  return ctx;
}

async function openTrackedSocket(ctx: TestContext, held: HeldSocket): Promise<net.Socket> {
  const socket = await openSocket(ctx);
  held.socket = socket;
  return socket;
}

function releaseServer(current: TestContext, previous: TestContext): TestContext {
  stopServer(current);
  return previous;
}

export type { HeldSocket, TestContext };
export {
  createTestServer,
  httpGet,
  listenWithCloser,
  openSocket,
  openTrackedSocket,
  releaseServer,
  sendHttpRequest,
  sleep,
  startServer,
  stopServer,
  whenRequestsReceived,
};
