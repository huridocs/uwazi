const migration = {
  delta: 59,

  name: 'missing_languages',

  description:
    'Migrate missing languages per sharedId, according to the expected languages in the collection.',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    process.stdout.write(`DB: ${db}\n`);
  },
};

export { migration };
