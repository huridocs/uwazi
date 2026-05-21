/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { Db, ObjectId } from 'mongodb';

const MIGRATION_MSG = 'Initial release (data migration)';

type LegacyPageDoc = {
  _id: ObjectId;
  sharedId?: string;
  language?: string;
  title?: string;
  user?: unknown;
  creationDate?: number;
  entityView?: boolean;
  markdownSupport?: boolean;
  metadata?: { content?: string; script?: string; css?: string };
  draft?: { content?: string; script?: string; css?: string };
  locales?: Record<string, unknown>;
};

const releaseUserId = (user: unknown): ObjectId => {
  if (user instanceof ObjectId) {
    return user;
  }
  if (typeof user === 'string' && ObjectId.isValid(user)) {
    return new ObjectId(user);
  }
  return new ObjectId();
};

const slugFromTitle = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'page';

const contentFromDoc = (doc: LegacyPageDoc) => {
  const draft = doc.draft;
  const meta = doc.metadata ?? {};
  return {
    content: draft?.content ?? meta.content ?? '',
    script: draft?.script ?? meta.script ?? '',
    css: draft?.css ?? meta.css ?? '',
  };
};

export default {
  delta: 189,

  reindex: false,

  name: 'pages-draft-releases',

  description:
    'Consolidates pages per sharedId with locales, initial page_releases, markdownSupport; removes legacy fields.',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const settings = await db.collection('settings').findOne({});
    const defaultLang =
      (settings as { languages?: { default?: boolean; key: string }[] })?.languages?.find(
        l => l.default
      )?.key ?? 'en';

    const legacyDocs = (await db
      .collection('pages')
      .find({ locales: { $exists: false } })
      .toArray()) as LegacyPageDoc[];

    const byShared = new Map<string, LegacyPageDoc[]>();
    legacyDocs.forEach(doc => {
      const sid = doc.sharedId ?? doc._id.toString();
      if (!byShared.has(sid)) {
        byShared.set(sid, []);
      }
      byShared.get(sid)!.push(doc);
    });

    let consolidated = 0;

    for (const [sharedId, docs] of byShared) {
      const canonical =
        docs.find(d => d.language === defaultLang) ?? docs[0];
      const locales: Record<string, { title: string; slug: string; draft: object }> = {};

      docs.forEach(doc => {
        const lang = doc.language ?? defaultLang;
        const title = doc.title ?? '';
        const draft = contentFromDoc(doc);
        locales[lang] = {
          title,
          slug: slugFromTitle(title),
          draft,
        };
      });

      const creationDate = canonical.creationDate ?? Date.now();
      const user = releaseUserId(canonical.user);
      const pageId = canonical._id;

      const releaseDoc: Record<string, unknown> = {
        page: pageId,
        version: 1,
        release_message: MIGRATION_MSG,
        user,
        date: creationDate,
      };

      Object.entries(locales).forEach(([lang, locale]) => {
        releaseDoc[lang] = {
          title: locale.title,
          slug: locale.slug,
          content: (locale.draft as { content: string }).content,
          script: (locale.draft as { script: string }).script,
          css: (locale.draft as { css: string }).css,
        };
      });

      await db.collection('page_releases').insertOne(releaseDoc);

      await db.collection('pages').updateOne(
        { _id: pageId },
        {
          $set: {
            sharedId,
            locales,
            markdownSupport: canonical.markdownSupport !== false,
            entityView: canonical.entityView ?? false,
            creationDate,
            user,
          },
          $unset: {
            language: '',
            releases: '',
            version: '',
            disableMarkdown: '',
            draft: '',
            'metadata.content': '',
            'metadata.script': '',
            'metadata.css': '',
          },
        }
      );

      const otherIds = docs.filter(d => !d._id.equals(pageId)).map(d => d._id);
      if (otherIds.length > 0) {
        await db.collection('pages').deleteMany({ _id: { $in: otherIds } });
      }

      consolidated += 1;
    }


    const slugOwnerByPage = new Map<string, string>();
    const pagesWithLocales = (await db
      .collection('pages')
      .find({ locales: { $exists: true } })
      .toArray()) as LegacyPageDoc[];

    for (const doc of pagesWithLocales) {
      const sharedId = doc.sharedId ?? doc._id.toString();
      const locales = doc.locales as Record<
        string,
        { title: string; slug: string; draft: object }
      >;
      if (!locales) {
        continue;
      }

      let changed = false;
      Object.entries(locales).forEach(([_lang, locale]) => {
        let slug = locale.slug || slugFromTitle(locale.title ?? '') || 'page';
        const base = slug;
        let suffix = 2;
        while (slugOwnerByPage.has(slug) && slugOwnerByPage.get(slug) !== sharedId) {
          slug = `${base}-${suffix}`;
          suffix += 1;
          changed = true;
        }
        if (locale.slug !== slug) {
          locale.slug = slug;
          changed = true;
        }
        slugOwnerByPage.set(slug, sharedId);
      });

      if (changed) {
        await db.collection('pages').updateOne({ _id: doc._id }, { $set: { locales } });
      }
    }

    process.stdout.write(`${this.name}: consolidated ${consolidated} page group(s).\r\n`);
  },
};
