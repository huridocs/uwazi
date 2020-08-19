//@ts-ignore
import redis from 'redis';
//@ts-ignore
import redisAdapter from 'socket.io-redis';
import cookie from 'cookie';
import { Server } from 'http';
import socketIo, { Server as SocketIoServer, Socket } from 'socket.io';
import { Application, Request, Response, NextFunction } from 'express';
import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';

declare global {
  namespace Express {
    export interface Request {
      getCurrentSessionSockets: Function;
      io: SocketIoServer;
    }
  }
  namespace SocketIO {
    export interface Server {
      emitToCurrentTenant(event: string, ...args: any[]): void;
    }
  }
}

const setupSockets = (server: Server, app: Application) => {
  const io: SocketIoServer = socketIo(server);

  io.on('connection', socket => {
    socket.join(socket.request.headers.tenant || tenants.defaultTenantName);
  });

  io.emitToCurrentTenant = (event, ...args) => {
    io.to(tenants.current().name).emit(event, ...args);
  };

  if (config.redis.activated) {
    io.adapter(
      redisAdapter({
        pubClient: redis.createClient(config.redis.port, config.redis.host, {
          retry_strategy: () => 3000,
        }),
        subClient: redis.createClient(config.redis.port, config.redis.host, {
          retry_strategy: () => 3000,
        }),
      })
    );
  }

  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  type sessionSockets = {
    sockets: Socket[];
    emit: Function;
  };

  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.getCurrentSessionSockets = () => {
      const sessionSockets: sessionSockets = {
        sockets: [],
        emit(event: string, ...args: any[]) {
          this.sockets.forEach(socket => {
            socket.emit(event, ...args);
          });
        },
      };

      Object.keys(req.io.sockets.connected).reduce((sockets, socketId) => {
        const socket = req.io.sockets.connected[socketId];

        if (typeof socket.request.headers.cookie !== 'string') {
          return sockets;
        }

        const socketCookie = cookie.parse(socket.request.headers.cookie);
        let sessionId;

        if (socketCookie['connect.sid']) {
          [, sessionId] = socketCookie['connect.sid'].split('.')[0].split(':');
        }

        //@ts-ignore
        if (sessionId === req.session.id) {
          sockets.sockets.push(socket);
        }

        return sockets;
      }, sessionSockets);

      return sessionSockets;
    };

    next();
  });
};

export { setupSockets };
