import { gunzipSync } from 'zlib';
import { ActivityLogEntry } from '../../domain/ActivityLogEntry.js';
import { ActivityLogArchive } from '../ActivityLogArchive.js';

const entry = (id: string, time: number, overrides: object = {}) =>
  ActivityLogEntry.restore({
    id,
    method: 'POST',
    url: '/api/entities',
    params: '{}',
    query: '{}',
    body: `{"title":"${id}"}`,
    userId: 'user1',
    username: 'admin',
    time,
    ...overrides,
  });

const read = async (archive: ActivityLogArchive) => {
  const chunks: Buffer[] = [];
  for await (const chunk of archive.content()) chunks.push(chunk as Buffer);
  return gunzipSync(Buffer.concat(chunks))
    .toString()
    .split('\n')
    .filter(line => line !== '')
    .map(line => JSON.parse(line));
};

describe('ActivityLogArchive', () => {
  const entries = [entry('a1', 1_000), entry('a2', 2_000, { username: null, body: null })];

  it('should be named after the first and last entries it holds', () => {
    expect(ActivityLogArchive.of(entries).filename).toBe('1000_2000_a1_activity.jsonl.gz');
  });

  it('should take the same name for the same entries, so storing it again replaces it', () => {
    expect(ActivityLogArchive.of(entries).filename).toBe(ActivityLogArchive.of(entries).filename);
  });

  it('should hold one entry per line, as stored, in the order given, gzipped', async () => {
    expect(await read(ActivityLogArchive.of(entries))).toEqual([
      {
        id: 'a1',
        method: 'POST',
        url: '/api/entities',
        params: '{}',
        query: '{}',
        body: '{"title":"a1"}',
        userId: 'user1',
        username: 'admin',
        time: 1_000,
      },
      {
        id: 'a2',
        method: 'POST',
        url: '/api/entities',
        params: '{}',
        query: '{}',
        body: null,
        userId: 'user1',
        username: null,
        time: 2_000,
      },
    ]);
  });

  it('should keep a line break inside an entry on its own line', async () => {
    const [stored] = await read(ActivityLogArchive.of([entry('a1', 1, { body: '{"a":"x\\ny"}' })]));

    expect(stored.body).toBe('{"a":"x\\ny"}');
  });

  it('should give its content afresh every time it is read', async () => {
    const archive = ActivityLogArchive.of(entries);

    expect(await read(archive)).toEqual(await read(archive));
  });
});
