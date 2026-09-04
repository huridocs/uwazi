import type { Request, Response, NextFunction } from 'express';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { resolveEmbedLocale } from '#shared/embed/resolveEmbedLocale.js';

declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}

const usesEmbedLocaleResolution = (path: string) => /^\/api\/public\/dataviz\//.test(path);

const parseLocaleQuery = (locale: Request['query']['locale']): string | string[] | undefined => {
  if (typeof locale === 'string') {
    return locale;
  }
  if (Array.isArray(locale)) {
    return locale.filter((value): value is string => typeof value === 'string');
  }
  return undefined;
};

// eslint-disable-next-line import/no-default-export
export default async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { languages = [] } =
      (await SettingsDataSourceFactory.default().readFields(['languages'])) ?? {};

    if (usesEmbedLocaleResolution(req.path)) {
      req.language = resolveEmbedLocale({
        localeQuery: parseLocaleQuery(req.query.locale),
        contentLanguage: req.get('content-language'),
        cookieLocale: req.cookies?.locale,
        acceptLanguage: req.get('accept-language'),
        languages,
      });
      next();
      return;
    }

    let lang = req.get('content-language');
    if (!lang && req.cookies) {
      lang = req.cookies.locale;
    }
    if (!lang && req.get('accept-language')) {
      [lang] = req.get('accept-language')!.split('-');
    }

    //@ts-ignore
    req.language = languages.find(l => l.key === lang) ? lang : languages.find(l => l.default).key;

    next();
  } catch (e) {
    next(e);
  }
};
