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
    if (this.stopped) {
      this.stopped();
      return;
    }

    await this.cb();
    await timeout(this.interval);
    await this.start(this.cb, this.interval);
  }

  async stop() {
    return new Promise(resolve => {
      this.stopped = resolve;
    });
  }
}
