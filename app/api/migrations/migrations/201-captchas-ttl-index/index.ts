import { Db } from 'mongodb';

export default {
  delta: 201,

  reindex: false,

  name: '201-captchas-ttl-index',

  description: 'Creates a TTL index on captchas.createdAt so captchas auto-expire after 10 hours.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await db.collection('captchas').createIndex({ createdAt: 1 }, { expireAfterSeconds: 36000 });

    process.stdout.write(`${this.name}: index created.\r\n`);
  },
};
