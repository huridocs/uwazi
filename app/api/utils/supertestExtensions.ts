import { Response } from 'supertest';
import Test from 'supertest/lib/test';

function extractStatusDebugInfo(res: Response): string {
  try {
    return JSON.stringify(JSON.parse(res.text), null, 2);
  } catch (e) {
    return res.text;
  }
}

export function extendSupertest() {
  //@ts-ignore
  const { _assertStatus } = Test.prototype;

  //@ts-ignore
  Test.prototype._assertStatus = function extendedAssertStatus(status: number, res: Response) {
    const err: Error = _assertStatus(status, res);
    if (err) {
      err.message += `\n ${extractStatusDebugInfo(res)}`;
      delete err.stack;
    }
    return err;
  };
}
