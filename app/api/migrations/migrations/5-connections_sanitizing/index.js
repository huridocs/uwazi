/* eslint-disable no-await-in-loop */
export default {
  delta: 5,

  name: 'connections_sanitizing',

  description: 'Sanitize connections across multiple languages',

  up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.resolve();
  }
};
