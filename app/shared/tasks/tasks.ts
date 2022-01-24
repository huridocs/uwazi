import { sleep } from 'shared/tsUtils';

export interface TaskStatus {
  state: 'undefined' | 'created' | 'running' | 'done' | 'failed';
  message?: string;
  result: any;
  startTime?: number;
  endTime?: number;
  previousTaskStatus?: TaskStatus;
}

export abstract class Task {
  status: TaskStatus;

  constructor() {
    this.status = { state: 'created', result: {} };
  }

  start(args: any) {
    if (this.status.state !== 'created') {
      throw Error('Cannot start task twice!');
    }
    this.status.state = 'running';
    this.status.startTime = Date.now();
    // This is a non-waiting then(), it kicks the task into the background.
    this.run(args).then(
      () => {
        this.status.state = 'done';
        this.status.endTime = Date.now();
      },
      (reason: any) => {
        this.status.state = 'failed';
        this.status.endTime = Date.now();
        this.status.message = `Failed with ${reason?.toString()}`;
      }
    );
  }

  async wait() {
    if (this.status.state === 'created') {
      throw Error('Cannot wait for unstarted task!');
    }
    while (this.status.state === 'running') {
      await sleep(50); // eslint-disable-line
    }
  }

  protected abstract run(_args: any): Promise<void>;
}

export class TaskProvider {
  static taskClasses: { [k: string]: new () => Task } = {};

  static registerClass(type: string, c: new () => Task) {
    if (Object.keys(this.taskClasses).includes(type)) {
      throw Error(`Duplicate task class ${type} registered!`);
    }
    TaskProvider.taskClasses[type] = c;
  }

  static taskInstances: { [k: string]: Task } = {};

  static getByName(name: string) {
    return this.taskInstances[name];
  }

  static getOrCreate(name: string, type: string) {
    let task = this.taskInstances[name];
    if (!task || ['done', 'failed'].includes(task.status.state)) {
      const TaskClass = this.taskClasses[type];
      if (!TaskClass) {
        throw Error(`No task provider found for task class ${type}!`);
      }
      const previousStatus = task?.status;
      if (previousStatus) {
        previousStatus.previousTaskStatus = undefined;
      }
      task = new TaskClass();
      if (!task) {
        throw Error(`Could not create instance of task class ${type}!`);
      }
      task.status.previousTaskStatus = previousStatus;
      this.taskInstances[name] = task;
    }
    return task;
  }

  static async runAndWait(name: string, type: string, args: any) {
    const task = this.getOrCreate(name, type);
    if (task.status.state === 'created') {
      task.start(args);
    }
    await task.wait();
    return task.status;
  }
}
