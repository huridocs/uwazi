import { TaskProvider, Task } from '../tasks';

class TestTask extends Task {
  protected async run(args: any) {
    if (args.a === 0) {
      throw Error('Bad a!');
    }
    this.status.message = `${args.a}`;
  }
}

describe('templates utils', () => {
  afterEach(async () => {
    TaskProvider.taskClasses = {};
    TaskProvider.taskInstances = {};
  });

  describe('run task', () => {
    it('starts and waits', async () => {
      TaskProvider.registerClass('TestTask', TestTask);
      expect(TaskProvider.getByName('a')).toBe(undefined);
      const t = TaskProvider.getOrCreate('a', 'TestTask');
      expect(TaskProvider.getByName('a')).toBe(t);
      expect(t.status.state).toBe('created');
      expect(t.status.startTime).toBe(undefined);
      t.start({ a: 1 });
      expect(t.status.state).toBe('running');
      expect(t.status.startTime).not.toBe(undefined);
      expect(t.status.endTime).toBe(undefined);
      await t.wait();
      expect(t.status.endTime).not.toBe(undefined);
      expect(t.status.state).toBe('done');
      expect(t.status.message).toBe('1');
    });

    it('starts and fails', async () => {
      TaskProvider.registerClass('TestTask', TestTask);
      const t = TaskProvider.getOrCreate('a', 'TestTask');
      t.start({ a: 0 });
      await t.wait();
      expect(t.status.state).toBe('failed');
      expect(t.status.message).toBe('Failed with Error: Bad a!');
    });

    it('starts twice', async () => {
      TaskProvider.registerClass('TestTask', TestTask);
      const t = TaskProvider.getOrCreate('a', 'TestTask');
      t.start({ a: 0 });
      await t.wait();
      expect(t.status.state).toBe('failed');
      const t2 = TaskProvider.getOrCreate('a', 'TestTask');
      expect(t2.status.state).toBe('created');
      t2.start({ a: 1 });
      await t2.wait();
      expect(t.status.state).toBe('failed');
      expect(t2.status.state).toBe('done');
      expect(t2.status.previousTaskStatus!.state).toBe('failed');
    });
  });
});
