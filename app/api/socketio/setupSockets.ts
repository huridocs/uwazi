import { createClient, RedisClient } from 'redis';
import cookie from 'cookie';
import { Server } from 'http';
import { Server as SocketIoServer } from 'socket.io';
import { Application, Request, Response, NextFunction } from 'express';
import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { createAdapter } from '@socket.io/redis-adapter';
import { handleError } from 'api/utils';
import { Emitter } from '@socket.io/redis-emitter';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  namespace Express {
    export interface Request {
      emitToSessionSocket: Function;
      sockets: {
        emitToCurrentTenant: Function;
      };
    }
  }
  namespace SocketIO {
    export interface Server {
      emitToCurrentTenant(event: string, ...args: any[]): void;
    }
  }
}

let io: SocketIoServer | Emitter;

let pubClient: RedisClient;
let subClient: RedisClient;

const emitToTenant = (tenantName: string, event: string, ...data: any[]) => {
  if (!io) {
    throw new Error('Socket.io Server not initialized');
  }
  // @ts-ignore
  io.to(tenantName).emit(event, ...data);
};

const setupApiSockets = (server: Server, app: Application) => {
  io = new SocketIoServer(server);

  io.on('connection', socket => {
    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    socket.join(socket.request.headers.tenant || config.defaultTenant.name);
    const socketCookie = cookie.parse(socket.request.headers.cookie || '');
    if (socketCookie) {
      //eslint-disable-next-line @typescript-eslint/no-floating-promises
      socket.join(socketCookie['connect.sid']);
    }
  });

  const sockets = {
    emitToCurrentTenant: (event: string, ...args: any[]) => {
      // @ts-ignore
      io.to(tenants.current().name).emit(event, ...args);
    },
  };

  if (config.redis.activated) {
    pubClient = new RedisClient({ host: config.redis.host, port: config.redis.port });
    subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    io.of('/').adapter.on('error', e => {
      handleError(e, { useContext: false });
    });
  }

  app.use((req, _res, next) => {
    req.sockets = sockets;
    next();
  });

  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.emitToSessionSocket = (event: string, ...args: any[]) => {
      const cookies = cookie.parse(req.get('cookie') || '');
      // @ts-ignore
      io.to(cookies['connect.sid']).emit(event, ...args);
    };

    next();
  });
};

const setupWorkerSockets = () => {
  if (io) {
    return;
  }
  const redisClient = createClient({ host: config.redis.host, port: config.redis.port });
  redisClient.on('error', error => {
    throw error;
  });

  redisClient.on('ready', () => {
    io = new Emitter(redisClient);
  });
};

const closeSockets = () => {
  io.disconnectSockets();
};

const endSocketServer = () => {
  pubClient.end(true);
  subClient.end(true);
};

export { setupApiSockets, setupWorkerSockets, emitToTenant, closeSockets, endSocketServer };
