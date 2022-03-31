const timeout = async interval =>
  new Promise(resolve => {
    setTimeout(resolve, interval);
  });

export class Repeater {
  constructor(cb, interval) {
    this.cb = cb;
    this.interval = interval;
    this.stopped = null;
  }

  async start() {
    while (!this.stopped) {
      // eslint-disable-next-line no-await-in-loop
      await this.cb();
      // eslint-disable-next-line no-await-in-loop
      await timeout(this.interval);
    }

    this.stopped();
  }

  async stop() {
    return new Promise(resolve => {
      this.stopped = resolve;
    });
  }
}
