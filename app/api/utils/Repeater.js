const timeout = async interval => new Promise((resolve) => {
  setTimeout(resolve, interval);
});

export default {
  stopped: false,

  async start(cb, interval) {
    if (!this.stopped) {
      await cb();
      await timeout(interval);
      await this.start(cb);
    }
  },

  stop() {
    this.stopped = true;
  }
};
