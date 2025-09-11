import { createAdapter } from '@socket.io/redis-adapter';
import { Emitter } from '@socket.io/redis-emitter';
import { config } from 'api/config';
import { tenants } from 'api/tenants/tenantContext';
import { handleError } from 'api/utils';
import * as cookie from 'cookie';
import { Application, NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { RedisClient } from 'redis';
import { Server as SocketIoServer } from 'socket.io';

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
let workerSocketsListenersAttached = false;

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
      socket.join(socketCookie['connect.sid'] || 'default-session-id');
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

    // Avoid MaxListenersExceededWarning in dev or tests where setup might be called multiple times
    // 0 means unlimited listeners; safe here because we control listener registration below
    // and we only add a constant small number of listeners.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pubClient.setMaxListeners && pubClient.setMaxListeners(0);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    subClient.setMaxListeners && subClient.setMaxListeners(0);

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

const setupWorkerSockets = (redisClient: RedisClient) => {
  if (io || workerSocketsListenersAttached) {
    return;
  }
  workerSocketsListenersAttached = true;
  // Avoid MaxListenersExceededWarning if called multiple times before 'ready'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  redisClient.setMaxListeners && redisClient.setMaxListeners(0);

  redisClient.once('error', error => {
    throw error;
  });

  redisClient.once('ready', () => {
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

export { closeSockets, emitToTenant, endSocketServer, setupApiSockets, setupWorkerSockets };
