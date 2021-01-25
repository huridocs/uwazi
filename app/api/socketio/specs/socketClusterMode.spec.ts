import request from 'supertest';
import express, { Application } from 'express';
import { Server } from 'http';
import io from 'socket.io-client';
import { multitenantMiddleware } from 'api/utils/multitenantMiddleware';
import { tenants, Tenant } from 'api/tenants/tenantContext';

import { setupSockets } from '../setupSockets';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';

const closeServer = async (httpServer: Server) =>
  new Promise(resolve => {
    httpServer.close(() => {
      resolve();
    });
  });

const connectSocket = async (
  port: number,
  tenant: string,
  session: string = ''
): Promise<SocketIOClient.Socket> =>
  new Promise(resolve => {
    const socket = io.connect(`http://localhost:${port}`, {
      transports: ['websocket'],
      //@ts-ignore
      extraHeaders: {
        tenant,
        ...(session ? { Cookie: `connect.sid=session:${session}` } : {}),
      },
    });

    socket.on('connect', () => {
      resolve(socket);
    });
  });

const createServer = async (app: Application, port: number) => {
  const server = new Server(app);
  await new Promise(resolve => {
    server.listen(port, 'localhost', () => {
      resolve();
    });
  });
  return server;
};

const port = 3051;
let server: Server;
let socket1: SocketIOClient.Socket;
let socket2: SocketIOClient.Socket;
let socket3: SocketIOClient.Socket;
let socket4: SocketIOClient.Socket;
const app: Application = express();

describe('socket middlewares setup', () => {
  beforeAll(async () => {
    server = await createServer(app, port);
    app.use(appContextMiddleware);
    app.use(multitenantMiddleware);
    setupSockets(server, app);

    tenants.add(<Tenant>{ name: 'tenant1' });
    tenants.add(<Tenant>{ name: 'tenant2' });

    app.get('/api/test', (req, res) => {
      req.io.emitToCurrentTenant('eventName', 'eventData');
      res.json({});
    });

    socket1 = await connectSocket(port, 'tenant1', 'session1');
    socket2 = await connectSocket(port, 'tenant1', 'session2');
    socket3 = await connectSocket(port, 'tenant2', 'session3');
    socket4 = await connectSocket(port, '', 'session4');
  });

  afterAll(async () => {
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();
    socket4.disconnect();
    await closeServer(server);
  });

  const captureEvents = (eventName: string = 'eventName') => {
    const events = { socket1: '', socket2: '', socket3: '', socket4: '' };
    socket1.once(eventName, (data: string) => {
      events.socket1 = data;
    });
    socket2.once(eventName, (data: string) => {
      events.socket2 = data;
    });
    socket3.once(eventName, (data: string) => {
      events.socket3 = data;
    });
    socket4.once(eventName, (data: string) => {
      events.socket4 = data;
    });
    return events;
  };

  const requestTestRoute = async (
    tenant?: string,
    route: string = '/api/test',
    session: string = ''
  ) => {
    const req = request(server).get(route);

    if (session) {
      await req.set('Cookie', `connect.sid=session:${session}`);
    }

    if (tenant) {
      await req.set('tenant', tenant);
    }

    return req.expect(response => {
      if (response.status !== 200) {
        throw new Error(response.text);
      }
    });
  };

  describe('when performing a request to tenant1', () => {
    it('should only emit socket events to tenant1 sockets', async () => {
      const socketEvents = captureEvents();

      await requestTestRoute('tenant1');

      expect(socketEvents.socket1).toBe('eventData');
      expect(socketEvents.socket2).toBe('eventData');
      expect(socketEvents.socket3).toBe('');
      expect(socketEvents.socket4).toBe('');
    });
  });

  describe('when performing a request to tenant2', () => {
    it('should only emit socket events to tenant2 sockets', async () => {
      const socketEvents = captureEvents();

      await requestTestRoute('tenant2');

      expect(socketEvents.socket1).toBe('');
      expect(socketEvents.socket2).toBe('');
      expect(socketEvents.socket3).toBe('eventData');
      expect(socketEvents.socket4).toBe('');
    });
  });

  describe('when performing a request without a tenant', () => {
    it('should emit to sockets connected as the default tenant', async () => {
      const socketEvents = captureEvents();
      await requestTestRoute();

      expect(socketEvents.socket1).toBe('');
      expect(socketEvents.socket2).toBe('');
      expect(socketEvents.socket3).toBe('');
      expect(socketEvents.socket4).toBe('eventData');
    });
  });

  describe('emitToCurrentSession', () => {
    beforeAll(() => {
      app.get('/api/onlySender', (req, res) => {
        req.emitToSessionSocket('onlySenderEvent', 'senderData');
        res.json({});
      });
    });

    it('should emit only to the initial sender session', async () => {
      let socketEvents = captureEvents('onlySenderEvent');
      await requestTestRoute('tenant1', '/api/onlySender', 'session1');

      expect(socketEvents.socket1).toBe('senderData');
      expect(socketEvents.socket2).toBe('');
      expect(socketEvents.socket3).toBe('');
      expect(socketEvents.socket4).toBe('');

      expect(socketEvents).toEqual({
        socket1: 'senderData',
        socket2: '',
        socket3: '',
        socket4: '',
      });

      socketEvents = captureEvents('onlySenderEvent');
      await requestTestRoute('tenant1', '/api/onlySender', 'session2');

      expect(socketEvents).toEqual({
        socket1: '',
        socket2: 'senderData',
        socket3: '',
        socket4: '',
      });
    });
  });

  it('should not fail when not sending a cookie', async () => {
    await connectSocket(port, 'tenant5');
    await requestTestRoute('tenant5', '/api/onlySender');
  });
});
