import { Request, Response, NextFunction } from 'express';
import settings from 'api/settings/settings';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}

export default async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let lang = req.get('content-language');
    if (!lang && req.cookies) {
      lang = req.cookies.locale;
    }
    if (!lang && req.get('accept-language')) {
      [lang] = req.get('accept-language')!.split('-');
    }

    const { languages = [] } = await settings.get();

    //@ts-ignore
    req.language = languages.find(l => l.key === lang) ? lang : languages.find(l => l.default).key;

    next();
  } catch (e) {
    next(e);
  }
};
