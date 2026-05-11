/* eslint-disable max-statements */
import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import {
  fixtures,
  relTypeAId,
  relTypeBId,
  entityAlreadyCorrectHubId,
  entityStaleHubId,
  entityStaleConnectionTargetId,
} from './fixtures.js';
import migration from '../index.js';

const up = async () => migration.up(testingDB.mongodb! as unknown as Db);

const connectionsFor = async (sharedId: string) =>
  testingDB.mongodb!.collection('connections').find({ entity: sharedId }).toArray();

const connectionsForHub = async (hubId: object) =>
  testingDB.mongodb!.collection('connections').find({ hub: hubId }).toArray();

describe('migration fix-missing-relationship-hubs', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have delta 187', () => {
    expect(migration.delta).toBe(187);
  });

  describe('creates missing hubs', () => {
    it('creates hub for unpublished entity with relationship metadata (core bug case)', async () => {
      await up();

      // Self-side entry must exist
      const selfEntries = await connectionsFor('entity-unpublished');
      expect(selfEntries).toHaveLength(1);

      // Both sides must share the same hub
      const { hub } = selfEntries[0];
      const hubConnections = await connectionsForHub(hub);
      expect(hubConnections).toHaveLength(2);

      const targetEntry = hubConnections.find(c => c.entity === 'target-entity-1');
      const selfEntry = hubConnections.find(c => c.entity === 'entity-unpublished');

      expect(targetEntry).toBeDefined();
      expect(selfEntry).toBeDefined();

      // Target side must carry the relation type; self side must not
      expect(targetEntry!.template.toString()).toBe(relTypeAId.toHexString());
      expect(selfEntry!.template).toBeUndefined();
    });

    it('creates hub for published entity with relationship metadata', async () => {
      await up();

      const selfEntries = await connectionsFor('entity-published');
      expect(selfEntries).toHaveLength(1);

      const { hub } = selfEntries[0];
      const hubConnections = await connectionsForHub(hub);
      expect(hubConnections).toHaveLength(2);

      const targetEntry = hubConnections.find(c => c.entity === 'target-entity-2');
      expect(targetEntry).toBeDefined();
      expect(targetEntry!.template.toString()).toBe(relTypeAId.toHexString());
    });
  });

  describe('already-correct hubs are not duplicated', () => {
    it('does not create a second hub when one already exists and matches metadata', async () => {
      await up();

      // Exactly two connections in the pre-existing hub — no more
      const hubConnections = await connectionsForHub(entityAlreadyCorrectHubId);
      expect(hubConnections).toHaveLength(2);

      const entities = hubConnections.map(c => c.entity).sort();
      expect(entities).toEqual(['entity-already-correct', 'target-entity-1'].sort());
    });
  });

  describe('stale hub entries', () => {
    it('deletes connection to target no longer in metadata and creates connection to new target', async () => {
      await up();

      // Old target-entity-3 connection must be gone
      const staleConnectionInDb = await testingDB
        .mongodb!.collection('connections')
        .findOne({ _id: entityStaleConnectionTargetId });
      expect(staleConnectionInDb).toBeNull();

      // Hub still exists with self-entry + new target-entity-4
      const hubConnections = await connectionsForHub(entityStaleHubId);
      expect(hubConnections).toHaveLength(2);

      const entities = hubConnections.map(c => c.entity).sort();
      expect(entities).toEqual(['entity-stale', 'target-entity-4'].sort());
    });
  });

  describe('entities that should not be processed', () => {
    it('does not create connections for entity with empty relationship metadata', async () => {
      await up();
      // entity-empty-meta has relA: [] — excluded by the migration filter
      const connections = await connectionsFor('entity-empty-meta');
      expect(connections).toHaveLength(0);
    });

    it('does not create connections for entity whose template has no relationship properties', async () => {
      await up();
      const connections = await connectionsFor('entity-no-rel-props');
      expect(connections).toHaveLength(0);
    });

    it('does not create connections for entity that only exists in a non-default language', async () => {
      await up();
      // entity-non-default-lang only has language: 'es'; migration only queries language: 'en'
      const connections = await connectionsFor('entity-non-default-lang');
      expect(connections).toHaveLength(0);
    });
  });

  describe('multiple relationship properties', () => {
    it('creates two independent hubs for a template with two relationship properties', async () => {
      await up();

      // Two self-side entries — one per relationship property
      const selfEntries = await connectionsFor('entity-multi-prop');
      expect(selfEntries).toHaveLength(2);

      const hubIds = selfEntries.map(c => c.hub.toString());
      const distinctHubs = new Set(hubIds);
      expect(distinctHubs.size).toBe(2);

      // First hub: relA → target-entity-4
      const hubAConnections = await connectionsForHub(selfEntries[0].hub);
      const hubBConnections = await connectionsForHub(selfEntries[1].hub);

      const allTargets = [...hubAConnections, ...hubBConnections]
        .filter(c => c.entity !== 'entity-multi-prop')
        .map(c => c.entity)
        .sort();
      expect(allTargets).toEqual(['target-entity-4', 'target-entity-5'].sort());

      // Each hub has exactly 2 entries (self + target)
      expect(hubAConnections).toHaveLength(2);
      expect(hubBConnections).toHaveLength(2);

      // Each non-self entry carries the correct relation type
      const relAEntry = [...hubAConnections, ...hubBConnections].find(
        c => c.entity === 'target-entity-4'
      );
      const relBEntry = [...hubAConnections, ...hubBConnections].find(
        c => c.entity === 'target-entity-5'
      );
      expect(relAEntry!.template.toString()).toBe(relTypeAId.toHexString());
      expect(relBEntry!.template.toString()).toBe(relTypeBId.toHexString());
    });
  });

  describe('idempotency', () => {
    it('running up() twice produces exactly the same connections — no duplicates', async () => {
      await up();

      const unpublishedBefore = await connectionsFor('entity-unpublished');
      const publishedBefore = await connectionsFor('entity-published');
      const alreadyCorrectHubBefore = await connectionsForHub(entityAlreadyCorrectHubId);
      const staleHubBefore = await connectionsForHub(entityStaleHubId);
      const multiPropBefore = await connectionsFor('entity-multi-prop');

      // Second run
      await up();

      const unpublishedAfter = await connectionsFor('entity-unpublished');
      const publishedAfter = await connectionsFor('entity-published');
      const alreadyCorrectHubAfter = await connectionsForHub(entityAlreadyCorrectHubId);
      const staleHubAfter = await connectionsForHub(entityStaleHubId);
      const multiPropAfter = await connectionsFor('entity-multi-prop');

      expect(unpublishedAfter).toHaveLength(unpublishedBefore.length);
      expect(publishedAfter).toHaveLength(publishedBefore.length);
      expect(alreadyCorrectHubAfter).toHaveLength(alreadyCorrectHubBefore.length);
      expect(staleHubAfter).toHaveLength(staleHubBefore.length);
      expect(multiPropAfter).toHaveLength(multiPropBefore.length);
    });
  });
});
