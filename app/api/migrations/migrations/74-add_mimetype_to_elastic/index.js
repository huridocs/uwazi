export default {
  delta: 74,

  name: 'add_mimetype_to_elastic',

  description: 'Adds the attachment mimetype to the elastic search mapping.',

  reindex: true,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
