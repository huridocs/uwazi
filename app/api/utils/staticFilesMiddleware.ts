import { NextFunction, Request, Response } from 'express';
import { pathFunction, fileExists } from 'api/files';
import { createError } from '.';

const checkFilePath = async (fileName: string, filePath: string) => {
  if (!fileName || !(await fileExists(filePath))) {
    throw createError('file not found', 404);
  }
};

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
  const path = pathToUse(req.params.fileName);
  try {
    await checkFilePath(req.params.fileName, path);
    res.sendFile(path);
  } catch (e) {
    next(e);
  }
};

export { staticFilesMiddleware };
