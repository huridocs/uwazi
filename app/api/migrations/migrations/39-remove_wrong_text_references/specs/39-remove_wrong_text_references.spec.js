import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove_wrong_text_references', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
    await migration.up(testingDB.mongodb);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(39);
  });

  it('should remove remove all connections with text but empty selectionRectangles', async () => {
    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ 'reference.text': { $exists: true } })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({ reference: { text: 'reference 1', selectionRectangles: [{}] } }),
      expect.objectContaining({ reference: { text: 'reference 2', selectionRectangles: [{}] } }),
    ]);
  });

  it('should remove references belonging to deleted references hubs (when only one remains)', async () => {
    const connections = await testingDB.mongodb
      .collection('connections')
      .find({ hub: { $exists: true } })
      .toArray();

    expect(connections).toEqual([
      expect.objectContaining({ hub: 'hub3' }),
      expect.objectContaining({ hub: 'hub3' }),
    ]);
  });

  it('should log the removed connections to stdout', async () => {
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('wrong reference 1'));
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringMatching('wrong reference 1 partner')
    );
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('wrong reference 2'));
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringMatching('wrong reference 2 partner')
    );
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching('wrong reference 3'));
  });

  it(`should remove empty SelectionRectangles from references that do not have reference text
    (mongoose was creating this empty array by default)`, async () => {
    const connections = await testingDB.mongodb
      .collection('connections')
      .find({
        reference: { $exists: false },
      })
      .toArray();

    expect(connections.length).toEqual(2);
  });
});
