import type { Server, IncomingMessage } from 'http';
import type { Application, RequestHandler } from 'express';
import type { Socket } from 'net';

interface GracefulShutdownOptions {
  server: Server;
  app: Application;
  cleanup: () => Promise<void>;
  timeout?: number;
  exit?: (code: number) => void;
  logger?: {
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

/**
 * Manages graceful HTTP server shutdown:
 *
 * 1. Sets a flag — the 503 middleware rejects new requests on
 *    already-established connections and destroys the socket.
 * 2. Closes idle keep-alive connections immediately.
 * 3. Stops accepting new TCP connections (http.close).
 * 4. Runs cleanup (DB, Redis, ES, socket.io) once all connections
 *    are drained.
 * 5. Force-exits after a configurable timeout if shutdown stalls.
 */
export class GracefulShutdown {
  private isShuttingDown = false;
  private server: Server;
  private cleanup: () => Promise<void>;
  private timeout: number;
  private exit: (code: number) => void;
  private logger: { log: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

  constructor(options: GracefulShutdownOptions) {
    this.server = options.server;
    this.cleanup = options.cleanup;
    this.timeout = options.timeout ?? 10000;
    this.exit = options.exit ?? (code => process.exit(code));
    this.logger = options.logger ?? console;

    this.mountMiddleware(options.app);
  }

  get shuttingDown(): boolean {
    return this.isShuttingDown;
  }

  shutdown(): void {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.log('SIGINT signal received.');

    this.server.closeIdleConnections();
    this.logger.log('Closed idle connections');

    this.server.close(error => {
      if (error) {
        this.logger.error(error.toString());
        this.exit(1);
        return;
      }
      this.logger.log('Gracefully closing express connections');
      this.cleanup()
        .then(() => {
          this.logger.log('Server closed successfully');
          this.exit(0);
        })
        .catch(err => {
          this.logger.error(String(err));
          this.exit(1);
        });
    });

    setTimeout(() => {
      this.logger.error('Forced shutdown after timeout');
      this.exit(1);
    }, this.timeout);
  }

  private mountMiddleware(app: Application): void {
    const reject503: RequestHandler = (req, res, next) => {
      if (this.isShuttingDown) {
        res.status(503).json({ error: 'Server is shutting down' });
        res.on('finish', () => (req as IncomingMessage & { socket: Socket }).socket.destroy());
        return;
      }
      next();
    };

    app.use(reject503);
  }
}
