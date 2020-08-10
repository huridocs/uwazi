import { Request, Response } from 'express';
import { attachmentsPath, uploadsPath, temporalFilesPath, customUploadsPath } from 'api/files';

type pathFunctionType =
  | typeof attachmentsPath
  | typeof uploadsPath
  | typeof temporalFilesPath
  | typeof customUploadsPath;

const staticFilesMiddleware = (pathFunction: pathFunctionType) => (req: Request, res: Response) => {
  res.sendFile(pathFunction(req.params.fileName));
};

export { staticFilesMiddleware };
