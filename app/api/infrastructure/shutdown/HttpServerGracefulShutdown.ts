import type { Server } from 'http';
import type { Application, RequestHandler } from 'express';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

interface HttpServerGracefulShutdownOptions {
  server: Server;
  app: Application;
  cleanup: () => Promise<void>;
  closeSockets?: () => void;
  timeout?: number;
  exit?: (code: number) => void;
  logger?: Logger;
}

/**
 * Manages graceful HTTP server shutdown:
 *
 * 1. Closes socket.io connections (if any) — must happen before http.close()
 *    or persistent WebSocket connections keep http.close() from firing.
 * 2. Sets a flag — the 503 middleware rejects new requests on
 *    already-established connections and destroys the socket.
 * 3. Closes idle keep-alive connections immediately.
 * 4. Stops accepting new TCP connections (http.close).
 * 5. Runs cleanup (DB, Redis, ES) once all connections are drained.
 * 6. Force-exits after a configurable timeout if shutdown stalls.
 */
export class HttpServerGracefulShutdown {
  private isShuttingDown = false;

  private server: Server;

  private cleanup: () => Promise<void>;

  private closeSockets: () => void;

  private timeout: number;

  private exit: (code: number) => void;

  private logger: Logger;

  private forceExitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HttpServerGracefulShutdownOptions) {
    this.server = options.server;
    this.cleanup = options.cleanup;
    this.closeSockets =
      options.closeSockets ?? // eslint-disable-next-line no-empty-function
      (() => {});
    this.timeout = options.timeout ?? 10000;
    this.exit = options.exit ?? (code => process.exit(code));
    this.logger = options.logger ?? LoggerFactory.systemLogger();

    this.mountMiddleware(options.app);
  }

  get shuttingDown(): boolean {
    return this.isShuttingDown;
  }

  shutdown(): void {
    if (this.isShuttingDown) {
      return;
    }

    this.closeSockets();

    this.isShuttingDown = true;
    this.logger.info('SIGINT signal received.');

    this.server.closeIdleConnections();
    this.logger.info('Closed idle connections');

    this.server.close(error => {
      this.clearForceExitTimer();
      if (error) {
        this.logger.error(error.toString());
        this.exit(1);
        return;
      }
      this.logger.info('Gracefully closing express connections');
      this.cleanup()
        .then(() => {
          this.logger.info('Server closed successfully');
          this.exit(0);
        })
        .catch(err => {
          this.logger.error(String(err));
          this.exit(1);
        });
    });

    this.forceExitTimer = setTimeout(() => {
      this.logger.warning('Forced shutdown after timeout');
      this.exit(1);
    }, this.timeout);
  }

  private clearForceExitTimer(): void {
    if (this.forceExitTimer) {
      clearTimeout(this.forceExitTimer);
      this.forceExitTimer = null;
    }
  }

  private mountMiddleware(app: Application): void {
    const reject503: RequestHandler = (req, res, next) => {
      if (this.isShuttingDown) {
        res.status(503).json({ error: 'Server is shutting down' });
        res.on('finish', () => req.socket.destroy());
        return;
      }
      next();
    };

    app.use(reject503);
  }
}
