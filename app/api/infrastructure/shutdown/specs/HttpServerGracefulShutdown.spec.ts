import {
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
  type HeldSocket,
  type TestContext,
} from './shutdownTestServer.js';

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
      const received = whenRequestsReceived(t.server, 1);
      const reqPromise = httpGet(`${t.url()}/slow`);
      await received;

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
      const held: HeldSocket = {};
      const previous = t;
      t = await listenWithCloser(() => held.socket?.destroy());
      const socket = await openTrackedSocket(t, held);
      socket.write('GET /slow HTTP/1.1\r\n');
      t.shutdown.shutdown();
      await sleep(600);
      expect(t.cleanupCalls).toContain('cleanup');
      expect(t.exitCalls).toEqual([0]);
      t = releaseServer(t, previous);
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
      const received = whenRequestsReceived(t.server, 3);
      const requests = Promise.all([
        httpGet(`${t.url()}/slow`),
        httpGet(`${t.url()}/slow`),
        httpGet(`${t.url()}/slow`),
      ]);
      await received;
      t.shutdown.shutdown();

      const results = await requests;
      for (const res of results) {
        expect(res.status).toBe(200);
      }
    });

    it('503 on existing connection while another request is in-flight', async () => {
      const socket = await openSocket(t);
      const received = whenRequestsReceived(t.server, 1);
      const slowPromise = httpGet(`${t.url()}/slow`);
      await received;

      t.shutdown.shutdown();

      const [response, slowRes] = await Promise.all([sendHttpRequest(socket), slowPromise]);
      expect(response).toContain('503');
      expect(response).toContain('Server is shutting down');
      expect(slowRes.status).toBe(200);

      socket.destroy();
    });
  });
});
