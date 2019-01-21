export default {
  delta: 10,

  name: 'sync-starting-point',

  description: 'Create a sync starting point so that everything required is already in the logs',

  up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject();
  }
};
