/* eslint-disable max-statements */
import type { LoginRequest, LoginResponse } from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/core/domain/user/User.js';
import { LoginInputSchema } from '#api/core/application/Login.js';
import { LoginUseCaseFactory } from '../../factories/LoginUseCaseFactory.js';
import { randomSleep } from '#shared/tsUtils.js';

// passport has no bundled types in this project; `logIn` is added to Request at runtime.
type RequestWithLogin = { logIn: (user: User, done: (err: unknown) => void) => void };

class LoginController extends AbstractController<LoginRequest> {
  protected async handle(): Promise<void> {
    await randomSleep(500, 1_000);

    const domain = `${this.request.protocol}://${ExecutionContext.tenant.domain}`;
    const startTime = Date.now();
    try {
      const input = LoginInputSchema.parse({ ...this.request.body, domain });

      const user = await LoginUseCaseFactory.default().execute(input);

      await this.establishSession(user);

      ExecutionContext.logger.info('User logged in successfully', {
        namespace: 'Auth_Login',
        success: true,
        durationMs: Date.now() - startTime,
      });

      const response: LoginResponse = { success: true };
      this.response.status(200).json(response);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Auth_Login',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }

  private async establishSession(user: User): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      (this.request as unknown as RequestWithLogin).logIn(user, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export { LoginController };
