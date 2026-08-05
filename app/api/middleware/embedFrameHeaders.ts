import type { Request, Response, NextFunction } from 'express';

const isEmbedPath = (path: string) => /^\/embed(\/|$)/.test(path);

const embedFrameHeaders = (req: Request, res: Response, next: NextFunction) => {
  if (isEmbedPath(req.path)) {
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    res.removeHeader('X-Frame-Options');
  }
  next();
};

export { embedFrameHeaders };
