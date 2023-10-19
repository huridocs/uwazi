const expectThrow = async (
  fn: () => Promise<void>,
  errorClass: any,
  message?: string,
  finallyCallback?: () => Promise<void>
) => {
  try {
    await fn();
    throw new Error(`Should have thrown an ${errorClass.name} error.`);
  } catch (e) {
    expect(e).toBeInstanceOf(errorClass);
    if (message) {
      expect(e.message).toBe(message);
    }
  } finally {
    if (finallyCallback) {
      await finallyCallback();
    }
  }
};

export { expectThrow };
