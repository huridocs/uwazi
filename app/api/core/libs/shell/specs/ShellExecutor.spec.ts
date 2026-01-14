import { ShellExecutor } from '../ShellExecutor';

describe('ShellExecutor', () => {
  let shellExecutor: ShellExecutor;

  beforeEach(() => {
    shellExecutor = new ShellExecutor();
  });

  describe('execute', () => {
    it('should execute command successfully and return stdout', async () => {
      const result = await shellExecutor.execute('ls', ['-la']);

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toContain('total');
      expect(result.getError()).toBeUndefined();
    });

    it('should execute command without arguments successfully', async () => {
      const result = await shellExecutor.execute('ls');

      expect(result.isOk()).toBe(true);
      expect(result.getData()?.match(/package.json/)).toBeTruthy();
      expect(result.getError()).toBeUndefined();
    });

    it('should return error when command fails', async () => {
      const result = await shellExecutor.execute('ls', ['/nonexistentdirectory']);

      expect(result.isError()).toBe(true);
      expect(result.getData()).toBeUndefined();
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError()?.message).toBe('Shell command failed');
      expect((result.getError()?.cause as Error).message.match(/cannot access/)).toBeTruthy();
    });

    it('should return error when command does not exist', async () => {
      const result = await shellExecutor.execute('nonexistentcommand12345');

      expect(result.isError()).toBe(true);
      expect(result.getData()).toBeUndefined();
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError()!.message).toBe('Shell command failed');
    });

    it('should handle command with multiple arguments', async () => {
      const result = await shellExecutor.execute('echo', ['hello', 'world']);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getData().trim()).toBe('hello world');
      }
      expect(result.getError()).toBeUndefined();
    });
  });
});
