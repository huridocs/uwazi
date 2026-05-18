/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { Db, ObjectId } from 'mongodb';

const MIGRATION_MSG = 'Initial release (data migration)';

const releaseUserId = (user: unknown): ObjectId => {
  if (user instanceof ObjectId) {
    return user;
  }
  if (typeof user === 'string' && ObjectId.isValid(user)) {
    return new ObjectId(user);
  }
  return new ObjectId();
};

export default {
  delta: 189,

  reindex: false,

  name: 'pages-draft-releases',

  description:
    'Adds draft and an initial release from legacy page metadata, sets markdownSupport on existing pages, removes legacy fields.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = db.collection('pages').find({
      $or: [{ releases: { $exists: false } }, { releases: { $size: 0 } }],
    });

    let updated = 0;
    for await (const doc of cursor) {
      const meta = (doc as { metadata?: { content?: string; script?: string; css?: string } })
        .metadata ?? { content: '', script: '', css: '' };
      const draft = (doc as { draft?: { content?: string; script?: string; css?: string } })
        .draft;
      const content = draft?.content ?? meta.content ?? '';
      const script = draft?.script ?? meta.script ?? '';
      const css = draft?.css ?? meta.css ?? '';

      const dateVal =
        typeof (doc as { creationDate?: number }).creationDate === 'number'
          ? (doc as { creationDate: number }).creationDate
          : Date.now();

      await db.collection('pages').updateOne(
        { _id: (doc as { _id: ObjectId })._id },
        {
          $set: {
            draft: { content, script, css },
            releases: [
              {
                version: 1,
                content,
                script,
                css,
                release_message: MIGRATION_MSG,
                user: releaseUserId((doc as { user?: unknown }).user),
                date: dateVal,
              },
            ],
            markdownSupport: true,
          },
          $unset: {
            version: '',
            disableMarkdown: '',
            'metadata.content': '',
            'metadata.script': '',
            'metadata.css': '',
          },
        }
      );
      updated += 1;
    }

    process.stdout.write(`${this.name}: updated ${updated} page(s).\r\n`);
  },
};
