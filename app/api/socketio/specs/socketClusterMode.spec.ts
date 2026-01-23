/* eslint-disable max-statements */
import request from 'supertest';
import express, { Application } from 'express';
import { Server } from 'http';
import io from 'socket.io-client';

import { multitenantMiddleware } from '#api/utils/multitenantMiddleware.js';

import { Tenant } from '#api/tenants/tenantContext.js';

import { appContextMiddleware } from '#api/utils/appContextMiddleware.js';

import { config } from '#api/config.js';
import waitForExpect from 'wait-for-expect';
import type { SessionData, Store as SessionStore } from 'express-session';
import users from '#api/users/users.js';

import {
  endSocketServer,
  setupApiSockets,
  emitToTenantAdmins,
  __testUtils,
} from '#api/socketio/setupSockets.js';
import { emitSocketEvent } from '#api/socketio/standaloneEmitSocketEvent.js';
import { tenants } from '#api/tenants/index.js';

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
    sessionId: string = ''
  ) => {
    const req = request(server).get(route);

    if (sessionId) {
      await req.set('Cookie', `connect.sid=session:${sessionId}`);
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

  describe('tenant admins room', () => {
    let adminSocketTenant1: SocketIOClient.Socket;
    let nonAdminSocketTenant1: SocketIOClient.Socket;
    let adminSocketTenant2: SocketIOClient.Socket;

    let sessionStore: SessionStore;

    beforeAll(async () => {
      sessionStore = __testUtils.getSessionStore();

      const setSession = async (sid: string, userId: string, tenantName: string) =>
        new Promise<void>((resolve, reject) => {
          const session: SessionData = {
            cookie: {
              originalMaxAge: null,
              expires: undefined,
              secure: false,
              httpOnly: true,
              path: '/',
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            passport: {
              user: `${userId}///${tenantName}`,
            } as any,
          } as any;

          sessionStore.set(sid, session, (err: unknown) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });

      await Promise.all([
        setSession('admin-session-tenant1', 'admin-user-tenant1', 'tenant1'),
        setSession('nonadmin-session-tenant1', 'editor-user-tenant1', 'tenant1'),
        setSession('admin-session-tenant2', 'admin-user-tenant2', 'tenant2'),
      ]);

      jest.spyOn(users, 'getById').mockImplementation(async (id: string) => {
        if (id === 'admin-user-tenant1' || id === 'admin-user-tenant2') {
          return { _id: id, role: 'admin' } as any;
        }
        return { _id: id, role: 'editor' } as any;
      });

      adminSocketTenant1 = await connectSocket(port, 'tenant1', 'admin-session-tenant1');
      nonAdminSocketTenant1 = await connectSocket(port, 'tenant1', 'nonadmin-session-tenant1');
      adminSocketTenant2 = await connectSocket(port, 'tenant2', 'admin-session-tenant2');
    });

    afterAll(() => {
      adminSocketTenant1.disconnect();
      nonAdminSocketTenant1.disconnect();
      adminSocketTenant2.disconnect();
      jest.restoreAllMocks();
    });

    it('should emit only to admin sockets of the target tenant', async () => {
      const events = {
        adminTenant1: '',
        nonAdminTenant1: '',
        adminTenant2: '',
      };

      adminSocketTenant1.once('adminEvent', (data: string) => {
        events.adminTenant1 = data;
      });
      nonAdminSocketTenant1.once('adminEvent', (data: string) => {
        events.nonAdminTenant1 = data;
      });
      adminSocketTenant2.once('adminEvent', (data: string) => {
        events.adminTenant2 = data;
      });

      emitToTenantAdmins('tenant1', 'adminEvent', 'payload');

      await waitForExpect(() => {
        expect(events).toEqual({
          adminTenant1: 'payload',
          nonAdminTenant1: '',
          adminTenant2: '',
        });
      });
    });
  });
});
