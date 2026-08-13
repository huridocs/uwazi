import type { Request, Response, NextFunction } from 'express';

const isEmbedPath = (path: string) => /^\/embed(\/|$)/.test(path);

/**
 * Public embeds are loaded in cross-origin iframes. Helmet defaults to
 * Cross-Origin-Resource-Policy: same-origin, which blocks that. Allow framing
 * and cross-origin embedding only on /embed/* routes.
 */
const embedFrameHeaders = (req: Request, res: Response, next: NextFunction) => {
  if (isEmbedPath(req.path)) {
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.removeHeader('X-Frame-Options');
  }
  next();
};

export { embedFrameHeaders };
