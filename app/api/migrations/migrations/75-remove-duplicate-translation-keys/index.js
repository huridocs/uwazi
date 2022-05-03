export default {
  delta: 75,

  name: 'remove-duplicate-translation-keys',

  description: `The migration makes sure that there are no multiples of the same key in a context. 
  It picks the first key-value pair, where the value differs from the key, if there is any.`,

  reindex: undefined,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
