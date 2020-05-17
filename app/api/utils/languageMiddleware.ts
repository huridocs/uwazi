import { Request, Response, NextFunction } from 'express';
import settings from 'api/settings/settings';

declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}

export default async (req: Request, _res: Response, next: NextFunction) => {
  let lang = req.get('content-language');
  if (!lang && req.cookies) {
    lang = req.cookies.locale;
  }
  if (!lang && req.get('accept-language')) {
    lang = req.get('accept-language')?.split('-')[0];
  }

  const { languages = [] } = await settings.get();

  const langExists = languages.find((l: any) => l.key === lang);
  if (!langExists) {
    req.language = languages.find((l: any) => l.default).key;
  }

  if (langExists) {
    req.language = lang || '';
  }

  next();
};
