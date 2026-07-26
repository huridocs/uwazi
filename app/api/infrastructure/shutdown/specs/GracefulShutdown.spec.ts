import { createServer, IncomingMessage } from 'http';
import http from 'http';
import net from 'net';
import express, { Application } from 'express';
import { GracefulShutdown } from '../GracefulShutdown';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function httpGet(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
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
  server: ReturnType<typeof createServer>;
  shutdown: GracefulShutdown;
  exitCalls: number[];
  loggerCalls: { log: unknown[][]; error: unknown[][] };
  cleanupCalls: string[];
  _baseUrl: string | null;
  url(): string;
}

function createTestServer({ delay = 50, timeout = 500 } = {}): TestContext {
  const app = express();
  const server = createServer(app);

  const exitCalls: number[] = [];
  const loggerCalls = { log: [] as unknown[][], error: [] as unknown[][] };
  const cleanupCalls: string[] = [];

  const shutdown = new GracefulShutdown({
    server,
    app,
    cleanup: async () => {
      cleanupCalls.push('cleanup');
    },
    timeout,
    exit: code => {
      exitCalls.push(code);
    },
    logger: {
      log: (...args: unknown[]) => loggerCalls.log.push(args),
      error: (...args: unknown[]) => loggerCalls.error.push(args),
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

  return {
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
}

function startServer(t: TestContext): Promise<void> {
  return new Promise(resolve => {
    t.server.listen(0, () => {
      t._baseUrl = `http://localhost:${t.server.address()!.port}`;
      resolve();
    });
  });
}

function stopServer(t: TestContext): void {
  try {
    (t.server as any).closeAllConnections?.();
  } catch {}
  t.server.close();
}

describe('GracefulShutdown', () => {
  let t: TestContext;

  beforeEach(async () => {
    t = createTestServer();
    await startServer(t);
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
      const socket = new net.Socket();
      await new Promise<void>(resolve => {
        socket.connect(t.server.address()!.port, '127.0.0.1', resolve);
      });

      t.shutdown.shutdown();

      const response = await new Promise<string>((resolve, reject) => {
        socket.write('GET /fast HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
        let data = '';
        socket.on('data', (chunk: Buffer) => (data += chunk.toString()));
        socket.on('end', () => resolve(data));
        socket.on('error', reject);
        setTimeout(() => reject(new Error('timeout')), 1000);
      });

      expect(response).toContain('503');
      expect(response).toContain('Server is shutting down');
      socket.destroy();
    });

    it('refuses new TCP connections after shutdown', async () => {
      t.shutdown.shutdown();

      try {
        await httpGet(`${t.url()}/fast`);
        fail('should have thrown');
      } catch (err: any) {
        expect(err.code).toMatch(/ECONNREFUSED|ECONNRESET/);
      }
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
      const socket = new net.Socket();
      await new Promise<void>(resolve => {
        socket.connect(t.server.address()!.port, '127.0.0.1', resolve);
      });

      t.shutdown.shutdown();

      await sleep(600);
      expect(t.exitCalls).toContain(1);

      socket.destroy();
    });

    it('logs each step of the shutdown sequence', () => {
      t.shutdown.shutdown();
      expect(t.loggerCalls.log).toEqual(
        expect.arrayContaining([
          ['SIGINT signal received.'],
          ['Closed idle connections'],
        ]),
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
      const socket = new net.Socket();
      await new Promise<void>(resolve => {
        socket.connect(t.server.address()!.port, '127.0.0.1', resolve);
      });

      const slowPromise = httpGet(`${t.url()}/slow`);
      await sleep(10);

      t.shutdown.shutdown();

      const response = await new Promise<string>((resolve, reject) => {
        socket.write('GET /fast HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
        let data = '';
        socket.on('data', (chunk: Buffer) => (data += chunk.toString()));
        socket.on('end', () => resolve(data));
        socket.on('error', reject);
        setTimeout(() => reject(new Error('timeout')), 1000);
      });

      expect(response).toContain('503');
      expect(response).toContain('Server is shutting down');

      const slowRes = await slowPromise;
      expect(slowRes.status).toBe(200);

      socket.destroy();
    });
  });
});
