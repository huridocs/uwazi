/** @format */
// TEST!!!

import * as otplib from 'otplib';
import needsAuthorization from 'api/auth/authMiddleware';

export default (app: {
  get: (
    arg0: string,
    arg1: (req: any, res: any, next: any) => any,
    arg2: (req: any, res: any, next: any) => void
  ) => void;
}) => {
  app.get('/api/auth2fa-secret', needsAuthorization(['admin', 'editor']), (req: any, res: any) => {
    const secret = otplib.authenticator.generateSecret();
    const otpauth = otplib.authenticator.keyuri(req.user.username, 'Uwazi', secret);
    res.json({ otpauth, secret });
  });
};
