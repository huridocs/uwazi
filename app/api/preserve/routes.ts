import { Application } from 'express';
import { Preserve } from './preserve';

export const PreserveRoutes = (app: Application) => {
  app.post('/api/preserve/', async (req, res, _next) => {
    const config = await Preserve.setup(req.language, req.user);
    res.json({ ...config });
  });
};
