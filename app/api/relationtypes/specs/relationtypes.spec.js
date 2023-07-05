import translations from 'api/i18n/translations';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ContextType } from 'shared/translationSchema';
import relationtypes from '../relationtypes.js';
import fixtures, { canNotBeDeleted, against, inRelProperty } from './fixtures.js';

describe('relationtypes', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('get()', () => {
    it('should return all the relationtypes in the database', async () => {
      const result = await relationtypes.get();
      expect(result.length).toBe(4);
      expect(result[0].name).toBe('Against');
    });
  });

  describe('getById()', () => {
    it('should return the relationtype with the id', async () => {
      const result = await relationtypes.getById(against);
      expect(result.name).toBe('Against');
    });
  });

  describe('save()', () => {
    beforeEach(() => {
      jest.spyOn(translations, 'addContext').mockImplementation(async () => Promise.resolve());
      jest.spyOn(translations, 'updateContext').mockImplementation(async () => Promise.resolve());
    });

    it('should generate names and ids for the properties', async () => {
      const result = await relationtypes.save({
        name: 'Indiferent',
        properties: [{ label: 'Property one' }],
      });
      expect(result.properties[0].name).toBe('property_one');
      expect(result.properties[0]._id).toBeDefined();
    });

    describe('when the relation type did not exist', () => {
      it('should create a new one and return it', async () => {
        const result = await relationtypes.save({ name: 'Indiferent', properties: [] });
        expect(result.name).toBe('Indiferent');
      });

      it('should create a new translation for it', async () => {
        const response = await relationtypes.save({ name: 'Indiferent', properties: [] });
        expect(translations.addContext).toHaveBeenCalledWith(
          response._id,
          'Indiferent',
          { Indiferent: 'Indiferent' },
          ContextType.relationshipType
        );
      });
    });

    describe('when the relation type exists', () => {
      it('should update it', async () => {
        const relationtype = await relationtypes.getById(against);
        relationtype.name = 'Not that Against';
        const result = await relationtypes.save(relationtype);
        expect(result.name).toBe('Not that Against');
      });

      it('should update the translation for it', async () => {
        const relationtype = await relationtypes.getById(against);
        relationtype.name = 'Pro';
        const response = await relationtypes.save(relationtype);
        expect(translations.updateContext).toHaveBeenCalledWith(
          { id: response._id.toString(), label: 'Pro', type: 'Connection' },
          { Against: 'Pro' },
          [],
          { Pro: 'Pro' }
        );
      });
    });

    describe('when its duplicated', () => {
      it('should return an error', async () => {
        const relationtype = { name: 'Against', properties: [] };
        try {
          await relationtypes.save(relationtype);
          throw new Error('should return an error');
        } catch (error) {
          expect(error).toBe('duplicated_entry');
        }
      });
    });

    describe('delete()', () => {
      beforeEach(() => {
        jest.spyOn(translations, 'deleteContext').mockImplementation(async () => Promise.resolve());
      });

      it('should remove it from the database and return true', done => {
        relationtypes
          .delete(against)
          .then(result => {
            expect(result).toBe(true);
            return relationtypes.getById(against);
          })
          .then(response => {
            expect(response).toBe(null);
            done();
          });
      });

      it('should remove the translation', done => {
        relationtypes.delete(against).then(() => {
          expect(translations.deleteContext).toHaveBeenCalledWith(against);
          done();
        });
      });

      it('when its been used should not delete it and return false', async () => {
        const result = await relationtypes.delete(canNotBeDeleted);
        expect(result).toBe(false);
        const result2 = await relationtypes.getById(canNotBeDeleted);
        expect(result2._id.equals(canNotBeDeleted)).toBe(true);
      });

      it('should throw if the type is used in a relationship property', async () => {
        try {
          await relationtypes.delete(inRelProperty);
          throw new Error('should have thrown error');
        } catch (e) {
          expect(e.message).toMatch('With rel prop');
        }
      });
    });
  });
});
