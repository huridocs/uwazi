import request from 'supertest';
import express, { Application } from 'express';
import { Server } from 'http';
import io from 'socket.io-client';
import { multitenantMiddleware } from 'api/utils/multitenantMiddleware';
import { tenants, Tenant } from 'api/tenants/tenantContext';
import { appContextMiddleware } from 'api/utils/appContextMiddleware';
import { config } from 'api/config';
import waitForExpect from 'wait-for-expect';

import { endSocketServer, setupApiSockets } from '../setupSockets';
import { emitSocketEvent } from '../standaloneEmitSocketEvent';

const closeServer = async (httpServer: Server): Promise<void> =>
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

let server: Server;

const createServer = async (app: Application, port: number) => {
  server = new Server(app);
  await new Promise<void>(resolve => {
    server.listen(port, resolve);
  });
  app.use(appContextMiddleware);
  app.use(multitenantMiddleware);
  config.redis.activated = true;
  setupApiSockets(server, app);
};

const port = 3051;
let socket1Tenant1: SocketIOClient.Socket;
let socket2Tenant1: SocketIOClient.Socket;
let socket3Tenant2: SocketIOClient.Socket;
let socket4TenantDefault: SocketIOClient.Socket;
const app: Application = express();

describe('socket middlewares setup', () => {
  beforeAll(async () => {
    await createServer(app, port);

    tenants.add(<Tenant>{ name: 'tenant1' });
    tenants.add(<Tenant>{ name: 'tenant2' });

    app.get('/api/test', (req, res) => {
      req.sockets.emitToCurrentTenant('eventName', 'eventData');
      res.json({});
    });

    socket1Tenant1 = await connectSocket(port, 'tenant1', 'session1');
    socket2Tenant1 = await connectSocket(port, 'tenant1', 'session2');
    socket3Tenant2 = await connectSocket(port, 'tenant2', 'session3');
    socket4TenantDefault = await connectSocket(port, '', 'session4');
  });

  afterAll(async () => {
    config.redis.activated = false;
    socket1Tenant1.disconnect();
    socket2Tenant1.disconnect();
    socket3Tenant2.disconnect();
    socket4TenantDefault.disconnect();

    await closeServer(server);
    endSocketServer();
  });

  const captureEvents = (eventName: string = 'eventName') => {
    const events = {
      socket1Tenant1: '',
      socket2Tenant1: '',
      socket3Tenant2: '',
      socket4TenantDefault: '',
    };
    socket1Tenant1.once(eventName, (data: string) => {
      events.socket1Tenant1 = data;
    });
    socket2Tenant1.once(eventName, (data: string) => {
      events.socket2Tenant1 = data;
    });
    socket3Tenant2.once(eventName, (data: string) => {
      events.socket3Tenant2 = data;
    });
    socket4TenantDefault.once(eventName, (data: string) => {
      events.socket4TenantDefault = data;
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

      expect(socketEvents.socket1Tenant1).toBe('eventData');
      expect(socketEvents.socket2Tenant1).toBe('eventData');
      expect(socketEvents.socket3Tenant2).toBe('');
      expect(socketEvents.socket4TenantDefault).toBe('');
    });
  });

  describe('when performing a request to tenant2', () => {
    it('should only emit socket events to tenant2 sockets', async () => {
      const socketEvents = captureEvents();

      await requestTestRoute('tenant2');

      expect(socketEvents.socket1Tenant1).toBe('');
      expect(socketEvents.socket2Tenant1).toBe('');
      expect(socketEvents.socket3Tenant2).toBe('eventData');
      expect(socketEvents.socket4TenantDefault).toBe('');
    });
  });

  describe('when performing a request without a tenant', () => {
    it('should emit to sockets connected as the default tenant', async () => {
      const socketEvents = captureEvents();
      await requestTestRoute();

      expect(socketEvents.socket1Tenant1).toBe('');
      expect(socketEvents.socket2Tenant1).toBe('');
      expect(socketEvents.socket3Tenant2).toBe('');
      expect(socketEvents.socket4TenantDefault).toBe('eventData');
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

      expect(socketEvents.socket1Tenant1).toBe('senderData');
      expect(socketEvents.socket2Tenant1).toBe('');
      expect(socketEvents.socket3Tenant2).toBe('');
      expect(socketEvents.socket4TenantDefault).toBe('');

      expect(socketEvents).toEqual({
        socket1Tenant1: 'senderData',
        socket2Tenant1: '',
        socket3Tenant2: '',
        socket4TenantDefault: '',
      });

      socketEvents = captureEvents('onlySenderEvent');
      await requestTestRoute('tenant1', '/api/onlySender', 'session2');

      expect(socketEvents).toEqual({
        socket1Tenant1: '',
        socket2Tenant1: 'senderData',
        socket3Tenant2: '',
        socket4TenantDefault: '',
      });
    });
  });

  it('should not fail when not sending a cookie', async () => {
    const socket5 = await connectSocket(port, 'tenant5');
    await requestTestRoute('tenant5', '/api/onlySender');
    socket5.disconnect();
  });

  describe('standalone emit to tenant', () => {
    it('should emit event to the specified tenant', async () => {
      const socketEvents = captureEvents('event');

      await emitSocketEvent('event', 'tenant1', 'data');

      await waitForExpect(async () => {
        expect(socketEvents).toMatchObject({
          socket1Tenant1: 'data',
          socket2Tenant1: 'data',
          socket3Tenant2: '',
          socket4TenantDefault: '',
        });
      });
    });

    it('should emit to all tenants when specifiyng "all"', async () => {
      const socketEvents = captureEvents('event');

      await emitSocketEvent('event', '', 'data');

      await waitForExpect(async () => {
        expect(socketEvents).toMatchObject({
          socket1Tenant1: 'data',
          socket2Tenant1: 'data',
          socket3Tenant2: 'data',
          socket4TenantDefault: 'data',
        });
      });
    });
  });
});
