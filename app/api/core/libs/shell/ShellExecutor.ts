/* eslint-disable max-classes-per-file */
import { spawn } from 'child_process';
import { Result, ResultType } from '../Result';

export class ShellError extends Error {
  constructor(error: Error) {
    super('Shell command failed', { cause: error });
  }
}

export class ShellExecutor {
  // eslint-disable-next-line class-methods-use-this
  async execute(command: string, args: string[] = []): Promise<ResultType<string, ShellError>> {
    return new Promise(resolve => {
      const child = spawn(command, args, { shell: true });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        if (code === 0) {
          resolve(Result.ok(stdout));
        } else {
          resolve(Result.fail(new ShellError(new Error(stderr))));
        }
      });

      child.on('error', error => {
        resolve(Result.fail(new ShellError(error)));
      });
    });
  }
}
