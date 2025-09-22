import { Fixture } from '../types';
import db from '../utils/testing_db.js';

const fixtures: Fixture = {
  settings: [{ _id: db.id(), languages: [{ key: 'en' }, { key: 'es' }] }],
};

export { fixtures };
