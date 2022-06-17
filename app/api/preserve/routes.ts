import { Application } from 'express';
import { Preserve } from './preserve';

export const PreserveRoutes = (app: Application) => {
  app.get('/api/preserve/', async (req, res, _next) => {
    await Preserve.setup(req.language);
    res.json({ token: 'AAA-BBB-CCC-000-111' });
  });
};
