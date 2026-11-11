import { spawn } from 'child_process';
import { Result, ResultType } from '#api/core/libs/Result.js';

type CommandRunner = {
  execute(command: string, args: string[]): Promise<ResultType<string, Error>>;
};

const runCommand = async (command: string, args: string[]): Promise<ResultType<string, Error>> =>
  new Promise(resolve => {
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    child.on('close', code => {
      if (code === 0) {
        resolve(Result.ok(stdout));
        return;
      }
      resolve(Result.fail(new Error(stderr || `${command} exited ${code}`)));
    });
    child.on('error', error => {
      resolve(Result.fail(error));
    });
  });

export type { CommandRunner };
export { runCommand };
