import { updateStates } from './updateState';

export default {
  delta: 79,

  name: 'Information_Extraction_generate_state',

  description: 'Generates and stores the current state for existing suggestions.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await updateStates(db, { state: { $exists: false } });
  },
};
