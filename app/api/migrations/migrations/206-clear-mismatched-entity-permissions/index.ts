/* eslint-disable no-await-in-loop */
import { Db, Document, ObjectId, UpdateFilter } from 'mongodb';

const normalizeStages = [
  { $set: { perms: { $ifNull: ['$permissions', []] } } },
  {
    $set: {
      perms: {
        $map: {
          input: '$perms',
          in: {
            $let: {
              vars: {
                refId: { $toString: { $ifNull: ['$$this.refId', null] } },
                type: { $ifNull: ['$$this.type', ''] },
                level: { $ifNull: ['$$this.level', ''] },
              },
              in: { r: '$$refId', t: '$$type', l: '$$level' },
            },
          },
        },
      },
    },
  },
  {
    $set: {
      perms: { $sortArray: { input: '$perms', sortBy: { r: 1, t: 1, l: 1 } } },
    },
  },
  {
    $set: {
      sig: {
        $reduce: {
          input: '$perms',
          initialValue: '',
          in: { $concat: ['$$value', '|', '$$this.r', '|', '$$this.t', '|', '$$this.l', ';'] },
        },
      },
    },
  },
];

const mismatchStages = [
  ...normalizeStages,

  // Collect the user-type refIds of THIS copy.
  {
    $set: {
      userRefs: {
        $map: {
          input: {
            $filter: { input: '$perms', as: 'p', cond: { $eq: ['$$p.t', 'user'] } },
          },
          as: 'p',
          in: '$$p.r',
        },
      },
    },
  },

  { $project: { sharedId: 1, sig: 1, userRefs: 1 } },

  {
    $group: {
      _id: '$sharedId',
      sigs: { $push: '$sig' },
      userRefs: { $push: '$userRefs' },
      copies: { $sum: 1 },
    },
  },

  { $match: { copies: { $gt: 1 } } },

  // Keep only groups where not every copy has the same signature.
  {
    $match: {
      $expr: {
        $not: [
          {
            $allElementsTrue: {
              $map: {
                input: '$sigs',
                as: 's',
                in: { $eq: ['$$s', { $arrayElemAt: ['$sigs', 0] }] },
              },
            },
          },
        ],
      },
    },
  },

  // Distinct user refIds across all copies of the group.
  {
    $set: {
      userRefs: {
        $reduce: {
          input: '$userRefs',
          initialValue: [],
          in: { $setUnion: ['$$value', '$$this'] },
        },
      },
    },
  },

  { $project: { _id: 0, sharedId: '$_id', userRefs: 1 } },
];

type MismatchedGroup = {
  sharedId: string;
  userRefs: string[];
};

// Keep each write small (short lock hold, well under MongoDB's 16MB BSON
// document limit for the $in array).
const WRITE_CHUNK = 10000;

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export default {
  delta: 206,

  name: 'clear-mismatched-entity-permissions',

  description:
    'Removes spurious admin/deleted/commandId user grants from entity language copies whose ' +
    'permissions arrays diverged (legacy V1 addLanguage bug stamped the installer grant onto ' +
    'new language copies only). Only the known-bad user grants are pulled — group grants and ' +
    'grants for live non-admin users are never touched.',

  reindex: false,

  requiresSchema: 14,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const groups = await db
      .collection('entities')
      .aggregate<MismatchedGroup>(
        [{ $match: { sharedId: { $exists: true, $ne: null } } }, ...mismatchStages],
        { allowDiskUse: true }
      )
      .toArray();

    if (groups.length === 0) {
      process.stdout.write(`${this.name}: no mismatched groups found.\r\n`);
      this.reindex = false;
      return;
    }

    const allRefs = new Set<string>();
    for (const group of groups) {
      group.userRefs.filter((ref): ref is string => Boolean(ref)).forEach(ref => allRefs.add(ref));
    }

    const validRefs = [...allRefs].filter(ref => ObjectId.isValid(ref));
    const users =
      validRefs.length > 0
        ? await db
            .collection('users')
            .find({ _id: { $in: validRefs.map(ref => new ObjectId(ref)) } })
            .toArray()
        : [];
    const userByRef = new Map(users.map(u => [u._id.toString(), u]));

    const badRefs = new Set<string>();
    for (const ref of allRefs) {
      const user = ObjectId.isValid(ref) ? userByRef.get(ref) : undefined;
      if (!user || user.deletedAt != null || user.role === 'admin') {
        badRefs.add(ref);
      }
    }

    if (badRefs.size === 0) {
      process.stdout.write(`${this.name}: no bad grants to remove.\r\n`);
      this.reindex = false;
      return;
    }

    // Match refId in both storage formats: V1 stored `user._id.toString()`
    // (string), V2 stores ObjectIds. Mongo's $in is type-strict, so each bad
    // ref must be included in both forms.
    const refIdValuesToPull: (ObjectId | string)[] = [];
    for (const ref of badRefs) {
      refIdValuesToPull.push(ref);
      if (ObjectId.isValid(ref)) refIdValuesToPull.push(new ObjectId(ref));
    }

    const sharedIds = groups.map(group => group.sharedId);

    let cleared = 0;
    for (const chunk of chunkArray(sharedIds, WRITE_CHUNK)) {
      const result = await db.collection('entities').updateMany({ sharedId: { $in: chunk } }, {
        $pull: {
          permissions: { refId: { $in: refIdValuesToPull }, type: 'user' },
        },
      } as unknown as UpdateFilter<Document>);
      cleared += result.modifiedCount;
    }

    this.reindex = cleared > 0;

    process.stdout.write(
      `${this.name}: removed ${badRefs.size} bad grant ref(s) from ${cleared} entity document(s) ` +
        `across ${groups.length} sharedId group(s).\r\n`
    );
  },
};
