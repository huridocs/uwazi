import { exec } from 'child_process';
import { Result, ResultType } from './Result';

export class ShellError extends Error {
  constructor(error: Error) {
    super('Shell command failed', { cause: error });
  }
}

export const shell = async (command: string) =>
  new Promise<ResultType<string, Error>>(resolve => {
    exec(command, (error, stdout) => {
      if (error) {
        resolve(Result.fail(new ShellError(error)));
        return;
      }
      resolve(Result.ok(stdout));
    });
  });
