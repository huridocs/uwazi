import { Request, Response } from 'express';
import { pathFunction, fileExists } from 'api/files';

const staticFilesMiddleware = (pathFunctions: pathFunction[]) => async (
  req: Request,
  res: Response
) => {
  const pathToUse = await pathFunctions.reduce<Promise<pathFunction>>(async (current, path) => {
    if (await fileExists(path(req.params.fileName))) {
      return path;
    }
    return current;
  }, Promise.resolve(pathFunctions[0]));

  res.sendFile(pathToUse(req.params.fileName));
};

export { staticFilesMiddleware };
