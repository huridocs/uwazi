import { Application, Request, Response, NextFunction } from 'express';
import { validation } from 'api/utils';
import date from '../utils/date';

export const datesConversionRoutes = (app: Application) => {
  app.post(
    '/api/date-to-seconds',
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            dateString: { type: 'string' },
            locale: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request, res: Response, _next: NextFunction) => {
      const dateSeconds = date.dateToSeconds(req.body.dateString, req.body.locale);
      res.status(200).json({ success: true, date: dateSeconds });
    }
  );
};
