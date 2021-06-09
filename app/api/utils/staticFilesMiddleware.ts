import { NextFunction, Request, Response } from 'express';
import { pathFunction, fileExists } from 'api/files';
import { createError } from '.';

const staticFilesMiddleware = (pathFunctions: pathFunction[]) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pathToUse = await pathFunctions.reduce<Promise<pathFunction>>(async (current, path) => {
    if (await fileExists(path(req.params.fileName))) {
      return path;
    }
    return current;
  }, Promise.resolve(pathFunctions[0]));
  try {
    if (!req.params.fileName || !(await fileExists(pathToUse(req.params.fileName)))) {
      throw createError('file not found', 404);
    }
    res.sendFile(pathToUse(req.params.fileName));
  } catch (e) {
    next();
  }
};

export { staticFilesMiddleware };
