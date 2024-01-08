export default {
  delta: 153,

  name: 'repair_select_parent_denormalization',

  description: 'Supply missing denormalization of parent values in select-like metadata.',

  reindex: false,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
