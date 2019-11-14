/** @format */
// TEST!!!

import * as otplib from 'otplib';
import needsAuthorization from 'api/auth/authMiddleware';
import users from 'api/users/users';

interface User {
  secret: string;
}

export default (app: {
  post: {
    (
      arg0: string,
      arg1: (req: any, res: any, next: any) => any,
      arg2: (req: any, res: any) => Promise<void>
    ): void;
    (
      arg0: string,
      arg1: (req: any, res: any, next: any) => any,
      arg2: (req: any, res: any) => void
    ): void;
  };
}) => {
  app.post(
    '/api/auth2fa-secret',
    needsAuthorization(['admin', 'editor']),
    async (req: any, res: any) => {
      if (req.user.usingf2a) {
        res.status(401);
        res.json({ status: 'Unauthorized' });
        return;
      }
      const secret = otplib.authenticator.generateSecret();
      const otpauth = otplib.authenticator.keyuri(req.user.username, 'Uwazi', secret);
      await users.setSecret(secret, req.user);
      res.json({ otpauth, secret });
    }
  );

  app.post(
    '/api/auth2fa-enable',
    needsAuthorization(['admin', 'editor']),
    async (req: any, res: any) => {
      const [user] = await users.get({ _id: req.user._id }, '+secret');
      const { token } = req.body;
      const isValid = otplib.authenticator.verify({ token, secret: user.secret });

      if (!isValid) {
        res.status(409);
        res.json({
          status: 'Conflict',
          error: 'The token does not validate against the secret key!',
        });
        return;
      }

      await users.enable2fa(req.user);

      res.json({ success: true });
    }
  );
};
