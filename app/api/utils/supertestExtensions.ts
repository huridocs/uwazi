import { Response } from 'supertest';
// @ts-ignore
import Test from 'supertest/lib/test';

function extractStatusDebugInfo(res: Response): string {
  switch (res.status) {
    case 400:
      return JSON.stringify(JSON.parse(res.text), null, 2);
    default:
      return '';
  }
}

export function extendSupertest() {
  const { _assertStatus } = Test.prototype;

  Test.prototype._assertStatus = function extendedAssertStatus(status: number, res: Response) {
    const err: Error = _assertStatus(status, res);
    if (err) {
      err.message += `\n ${extractStatusDebugInfo(res)}`;
      delete err.stack;
    }
    return err;
  };
}
