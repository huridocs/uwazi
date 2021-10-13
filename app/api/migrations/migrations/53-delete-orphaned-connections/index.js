/* eslint-disable no-await-in-loop */
export default {
  delta: 53,

  name: 'delete-orphaned-connections',

  description: 'Hot Patched to do nothing',

  async up() {
    process.stdout.write('Hot Patched to do nothing');
  },
};
