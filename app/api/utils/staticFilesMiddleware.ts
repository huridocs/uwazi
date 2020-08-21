import { Request, Response } from 'express';
import {
  attachmentsPath,
  uploadsPath,
  temporalFilesPath,
  customUploadsPath,
  fileExists,
} from 'api/files';

type pathFunctionType =
  | typeof attachmentsPath
  | typeof uploadsPath
  | typeof temporalFilesPath
  | typeof customUploadsPath;

const staticFilesMiddleware = (pathFunctions: pathFunctionType[]) => async (
  req: Request,
  res: Response
) => {
  const pathToUse = await pathFunctions.reduce<Promise<pathFunctionType>>(
    async (current, pathFunction) => {
      if (await fileExists(pathFunction(req.params.fileName))) {
        return pathFunction;
      }
      return current;
    },
    Promise.resolve(pathFunctions[0])
  );

  res.sendFile(pathToUse(req.params.fileName));
};

export { staticFilesMiddleware };
