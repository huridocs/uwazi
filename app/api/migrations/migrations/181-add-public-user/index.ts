import { Db, ObjectId } from 'mongodb';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const PUBLIC_USER_ID = new ObjectId('698c35e7cf8880419d91fe4d');

const SALT_ROUNDS = 10;

const encryptPassword = async (plainPassword: string) => bcrypt.hash(plainPassword, SALT_ROUNDS);

export default {
  delta: 181,

  reindex: false,

  name: 'add-public-user',

  description: 'Adds the Public system user for public API endpoint',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const existingUser = await db.collection('users').findOne({ _id: PUBLIC_USER_ID });

    if (existingUser) {
      process.stdout.write('Public user already exists, skipping...\r\n');
      return;
    }

    const password = crypto.randomBytes(32).toString('hex');
    const encryptedPassword = await encryptPassword(password);

    await db.collection('users').insertOne({
      _id: PUBLIC_USER_ID,
      username: 'PublicUser',
      email: 'public@uwazi.local',
      password: encryptedPassword,
      role: 'collaborator',
      using2fa: false,
    });

    process.stdout.write('Public user created successfully.\r\n');
  },
};

export { PUBLIC_USER_ID };
