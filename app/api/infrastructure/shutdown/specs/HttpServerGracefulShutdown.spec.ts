import http, { IncomingMessage } from 'http';
import net, { AddressInfo } from 'net';
import express, { Application } from 'express';
import { HttpServerGracefulShutdown } from '../HttpServerGracefulShutdown.js';

const sleep = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

async function httpGet(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    // Use a fresh non-keep-alive agent to avoid polluting the global pool
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
  server: ReturnType<typeof http.createServer>;
  shutdown: HttpServerGracefulShutdown;
  exitCalls: number[];
  loggerCalls: { log: unknown[][]; error: unknown[][] };
  cleanupCalls: string[];
  _baseUrl: string | null;
  url(): string;
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

async function startServer(t: TestContext): Promise<string> {
  return new Promise(resolve => {
    t.server.listen(0, () => {
      const url = `http://localhost:${(t.server.address() as AddressInfo).port}`;
      resolve(url);
    });
  });
}

function stopServer(t: TestContext): void {
  try {
    t.server.closeAllConnections?.();
  } catch {
    // server may already be closed
  }
  t.server.close();
}

async function openSocket(t: TestContext): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect((t.server.address() as AddressInfo).port, '127.0.0.1', () => {
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

describe('HttpServerGracefulShutdown', () => {
  let t: TestContext;

  beforeEach(async () => {
    t = createTestServer();
    t._baseUrl = await startServer(t);
  });

  afterEach(() => {
    stopServer(t);
  });

  describe('middleware', () => {
    it('passes requests through when not shutting down', async () => {
      const res = await httpGet(`${t.url()}/fast`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('returns 503 on connections established before shutdown', async () => {
      const socket = await openSocket(t);
      t.shutdown.shutdown();
      const response = await sendHttpRequest(socket);
      expect(response).toContain('503');
      expect(response).toContain('Server is shutting down');
      socket.destroy();
    });

    it('refuses new TCP connections after shutdown', async () => {
      t.shutdown.shutdown();

      await expect(httpGet(`${t.url()}/fast`)).rejects.toMatchObject({
        code: expect.stringMatching(/ECONNREFUSED|ECONNRESET/),
      });
    });

    it('allows in-flight requests to complete normally', async () => {
      const reqPromise = httpGet(`${t.url()}/slow`);
      await sleep(10);

      t.shutdown.shutdown();

      const res = await reqPromise;
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe('shutdown sequence', () => {
    it('sets shuttingDown to true', () => {
      expect(t.shutdown.shuttingDown).toBe(false);
      t.shutdown.shutdown();
      expect(t.shutdown.shuttingDown).toBe(true);
    });

    it('is idempotent', () => {
      t.shutdown.shutdown();
      t.shutdown.shutdown();
      expect(t.exitCalls.length).toBeLessThanOrEqual(1);
    });

    it('runs cleanup and exits 0 after all connections close', async () => {
      t.shutdown.shutdown();
      await sleep(200);

      expect(t.cleanupCalls).toContain('cleanup');
      expect(t.exitCalls).toEqual([0]);
    });

    it('force-exits with code 1 after timeout', async () => {
      const socket = await openSocket(t);
      t.shutdown.shutdown();
      await sleep(600);
      expect(t.exitCalls).toContain(1);
      socket.destroy();
    });

    it('completes shutdown even with persistent connections', async () => {
      let persistentSocket: net.Socket | null = null;

      const oldT = t;
      t = createTestServer({
        closeSockets: () => {
          persistentSocket?.destroy();
        },
      });
      t._baseUrl = await startServer(t);

      // Simulate a socket.io-like persistent connection:
      // open TCP, send partial HTTP (parser becomes active, not idle)
      persistentSocket = await openSocket(t);
      persistentSocket.write('GET /slow HTTP/1.1\r\n'); // incomplete request

      t.shutdown.shutdown();

      // With closeSockets() called BEFORE http.close(),
      // persistent connections are destroyed immediately.
      // http.close() fires its callback, cleanup runs, exit is 0.
      await sleep(600);

      expect(t.cleanupCalls).toContain('cleanup');
      expect(t.exitCalls).toEqual([0]);

      stopServer(t);
      t = oldT;
    });

    it('logs each step of the shutdown sequence', async () => {
      t.shutdown.shutdown();
      await sleep(200);
      expect(t.loggerCalls.log).toEqual(
        expect.arrayContaining([
          ['SIGINT signal received.'],
          ['Closed idle connections'],
          ['Gracefully closing express connections'],
          ['Server closed successfully'],
        ])
      );
    });
  });

  describe('with active connections', () => {
    it('handles multiple concurrent in-flight requests', async () => {
      const requests = Promise.all([
        httpGet(`${t.url()}/slow`),
        httpGet(`${t.url()}/slow`),
        httpGet(`${t.url()}/slow`),
      ]);

      await sleep(10);
      t.shutdown.shutdown();

      const results = await requests;
      for (const res of results) {
        expect(res.status).toBe(200);
      }
    });

    it('503 on existing connection while another request is in-flight', async () => {
      const socket = await openSocket(t);
      const slowPromise = httpGet(`${t.url()}/slow`);
      await sleep(10);

      t.shutdown.shutdown();

      const [response, slowRes] = await Promise.all([sendHttpRequest(socket), slowPromise]);
      expect(response).toContain('503');
      expect(response).toContain('Server is shutting down');
      expect(slowRes.status).toBe(200);

      socket.destroy();
    });
  });
});
