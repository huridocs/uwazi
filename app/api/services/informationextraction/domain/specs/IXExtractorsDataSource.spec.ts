import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { IXExtractorsDataSource } from '../IXExtractorsDataSource.js';
import { IXExtractorsDAOFactory } from '../../infrastructure/IXExtractorsDAOFactory.js';
import {
  byName,
  extractors,
  f,
  fixtures,
  TENANT_ID,
  testConfigs,
} from './IXExtractorsContractFixtures.js';

type Sut = () => IXExtractorsDataSource;

const readSyncLogs = async () => db.mongodb!.collection('updatelogs').find().toArray();

const readCases = (sut: Sut) => {
  describe('getById()', () => {
    it('should return the extractor', async () => {
      expect(await sut().getById(extractors.textOnAB._id)).toEqual(extractors.textOnAB);
    });

    it('should return undefined for an unknown id', async () => {
      expect(await sut().getById(f.id('unknown'))).toBeUndefined();
    });
  });

  describe('getByIds()', () => {
    it('should return the requested extractors that exist', async () => {
      const result = await sut().getByIds([
        extractors.textOnA._id,
        extractors.pdfOnB._id,
        f.id('unknown'),
      ]);

      expect(byName(result)).toEqual(byName([extractors.textOnA, extractors.pdfOnB]));
    });
  });

  describe('getAll()', () => {
    it('should return every extractor', async () => {
      expect(byName(await sut().getAll())).toEqual(byName(Object.values(extractors)));
    });
  });

  describe('getByTemplate()', () => {
    it('should return every extractor targeting the template, regardless of source', async () => {
      const result = await sut().getByTemplate(f.id('template A'));

      expect(byName(result)).toEqual(
        byName([extractors.textOnA, extractors.pdfOnA, extractors.textOnAB])
      );
    });
  });

  describe('getPropertySourceExtractorsForTemplate()', () => {
    it('should return only the extractors whose source is a property', async () => {
      const result = await sut().getPropertySourceExtractorsForTemplate(f.id('template A'));

      expect(byName(result)).toEqual(byName([extractors.textOnA, extractors.textOnAB]));
    });
  });

  describe('getPdfSourceExtractorsForTemplate()', () => {
    it('should return only the extractors whose source is the pdf', async () => {
      const result = await sut().getPdfSourceExtractorsForTemplate(f.id('template B'));

      expect(result).toEqual([extractors.pdfOnB]);
    });
  });

  describe('getByTemplateExcludingProperties()', () => {
    it('should return the extractors on the template whose property is not kept', async () => {
      const result = await sut().getByTemplateExcludingProperties(f.id('template A'), ['target_a']);

      expect(byName(result)).toEqual(byName([extractors.pdfOnA, extractors.textOnAB]));
    });

    it('should return every extractor on the template when nothing is kept', async () => {
      const result = await sut().getByTemplateExcludingProperties(f.id('template A'), []);

      expect(byName(result)).toEqual(
        byName([extractors.textOnA, extractors.pdfOnA, extractors.textOnAB])
      );
    });
  });
};

const writeCases = (sut: Sut) => {
  describe('create()', () => {
    it('should store the extractor and return it with ObjectId ids', async () => {
      const created = await sut().create({
        name: 'created',
        property: 'target_e',
        source: { property: 'source_e' },
        templates: [f.idString('template B')],
      });

      const expected = {
        _id: created._id,
        name: 'created',
        property: 'target_e',
        source: { property: 'source_e' },
        templates: [f.id('template B')],
      };
      expect(created).toEqual(expected);
      expect(await sut().getById(created._id)).toEqual(expected);
    });
  });

  describe('update()', () => {
    it('should replace the fields of the extractor and return it', async () => {
      const changed = {
        ...extractors.textOnA,
        name: 'renamed',
        templates: [f.id('template B')],
      };

      const updated = await sut().update({
        ...changed,
        templates: [f.idString('template B')],
      });

      expect(updated).toEqual(changed);
      expect(await sut().getById(extractors.textOnA._id)).toEqual(changed);
    });
  });

  describe('deleteByIds()', () => {
    it('should delete only the given extractors', async () => {
      await sut().deleteByIds([extractors.textOnA._id, extractors.pdfOnB._id]);

      expect(byName(await sut().getAll())).toEqual(
        byName([extractors.pdfOnA, extractors.textOnAB, extractors.withoutTemplates])
      );
    });
  });

  describe('removeTemplateFromExtractors()', () => {
    it('should detach the template from the given extractors only', async () => {
      await sut().removeTemplateFromExtractors(
        [extractors.textOnA._id, extractors.textOnAB._id],
        f.id('template A')
      );

      expect(byName(await sut().getAll())).toEqual(
        byName([
          { ...extractors.textOnA, templates: [] },
          extractors.pdfOnA,
          { ...extractors.textOnAB, templates: [f.id('template B')] },
          extractors.pdfOnB,
          extractors.withoutTemplates,
        ])
      );
    });
  });

  describe('deleteEmptyByIds()', () => {
    it('should delete only the given extractors left without templates', async () => {
      await sut().deleteEmptyByIds([
        extractors.textOnA._id,
        extractors.pdfOnA._id,
        extractors.withoutTemplates._id,
      ]);

      expect(byName(await sut().getAll())).toEqual(
        byName([extractors.textOnA, extractors.pdfOnA, extractors.textOnAB, extractors.pdfOnB])
      );
    });
  });
};

/**
 * Information extraction data is not synced between instances, so no IX write may leave an
 * `updatelogs` row behind, on either backend.
 */
const syncLogCases = (sut: Sut) => {
  describe('sync logging', () => {
    it('should not record sync logs on create, update, template removal or delete', async () => {
      await sut().create({
        name: 'created',
        property: 'target_e',
        source: { property: 'source_e' },
        templates: [f.idString('template A')],
      });
      await sut().update({ ...extractors.textOnA, name: 'renamed' });
      await sut().removeTemplateFromExtractors([extractors.pdfOnA._id], f.id('template A'));
      await sut().deleteByIds([extractors.pdfOnB._id]);

      expect(await readSyncLogs()).toEqual([]);
    });
  });
};

/**
 * The IXExtractorsDataSource contract suite: one set of cases, run against the Mongo and the
 * Postgres implementation. Expectations are the fixture documents themselves, compared with
 * `toEqual`, so a field present on one backend and absent on the other fails.
 */
describe('IXExtractorsDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() =>
        usePostgres ? IXExtractorsDAOFactory.postgres() : IXExtractorsDAOFactory.mongo()
      );

    readCases(sut);
    writeCases(sut);
    syncLogCases(sut);
  });
});
