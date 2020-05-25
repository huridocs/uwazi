import { Request, Response } from 'express';

const staticFilesMiddleware = (pathFunction: (fileName: string) => string) => (
  req: Request,
  res: Response
) => {
  res.sendFile(pathFunction(req.params.fileName));
};

export { staticFilesMiddleware };
