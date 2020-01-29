export default {
  delta: 18,

  name: 'fix-malformed-metadata',

  description: 'Migration to sanitize values and labels of non-string values',

  up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject();
  }
};
