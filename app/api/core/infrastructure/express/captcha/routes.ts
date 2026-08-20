import type { Application } from 'express';
import cors from 'cors';
import { CaptchaController } from './CaptchaController.js';
import { RemoteCaptchaController } from './RemoteCaptchaController.js';

const corsOptions = {
  origin: true,
  methods: 'GET',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Registered from server.js before privateInstanceMiddleware: neither private instance
// middleware allowlists these paths, and both match forbiddenRoutes through the /api/ prefix,
// so registering them any later would 401 every captcha request on a private instance.
const captchaRoutes = (app: Application) => {
  app.get('/api/captcha', cors(corsOptions), CaptchaController.createHandler());

  app.get('/api/remotecaptcha', RemoteCaptchaController.createHandler());
};

export { captchaRoutes };
