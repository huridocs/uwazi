// @ts-ignore
import Test from 'supertest/lib/test';
import { extendSupertest } from '../supertestExtensions';

describe('assertStatus', () => {
  const mockError = new Error('mock error');
  const assertStatusMock = jest.fn().mockReturnValue(mockError);
  beforeEach(() => {
    Test.prototype._assertStatus = assertStatusMock;
    extendSupertest();
  });

  it('should use the original method', () => {
    const result = Test.prototype._assertStatus(0, {});
    expect(assertStatusMock).toHaveBeenCalledWith(0, {});
    expect(result).toBe(mockError);
  });

  describe('when the assert fails', () => {
    it('should add the body for a 400 code', async () => {
      const result = Test.prototype._assertStatus(200, {
        status: 400,
        text: JSON.stringify('validation error'),
      });
      await expect(result.message).toMatch('validation error');
      expect(result.stack).toBeUndefined();
    });
  });
});
