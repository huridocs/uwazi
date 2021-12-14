/* eslint-disable max-lines,max-statements */

import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { EntitySchema } from 'shared/types/entityType';
import templates from 'api/templates';
import { TemplateSchema } from 'shared/types/templateType';
import * as entitiesIndex from 'api/search/entitiesIndex';
import fixtures, { templateId, simpleTemplateId, nonExistentId } from './validatorFixtures';

import { customErrorMessages } from '../validation/metadataValidators.js';
import { validateEntity } from '../validateEntity';

describe('validateEntity', () => {
  beforeEach(async () => {
    spyOn(entitiesIndex, 'updateMapping').and.returnValue(Promise.resolve());
    //@ts-ignore
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('validateEntity', () => {
    const createEntity = (entity: {}): EntitySchema => ({
      _id: 'entity',
      sharedId: 'sharedId',
      title: 'Test',
      template: templateId.toString(),
      language: 'en',
      mongoLanguage: 'en',
      metadata: {},
      ...entity,
    });

    const testValid = async (entity: EntitySchema) => {
      try {
        await validateEntity(entity);
      } catch (e) {
        if (e instanceof Ajv.ValidationError) {
          throw JSON.stringify(e, null, ' ');
        }
        throw e;
      }
    };

    const expectError = async (
      entity: EntitySchema,
      message: string,
      dataPath: string,
      restOfError: Partial<Ajv.ErrorObject> = {}
    ) => {
      await expect(validateEntity(entity)).rejects.toHaveProperty(
        'errors',
        expect.arrayContaining([expect.objectContaining({ dataPath, message, ...restOfError })])
      );
    };

    it('should allow ObjectId for _id fields', async () => {
      const entity = createEntity({
        _id: db.id(),
        user: db.id(),
        template: templateId,
      });
      await testValid(entity);
    });

    it('should allow removing the icon', async () => {
      const entity = createEntity({ icon: { _id: null, type: 'Empty' } });
      await testValid(entity);
    });

    it('should allow template to be missing', async () => {
      let entity = createEntity({ template: undefined });
      await testValid(entity);
      entity = createEntity({ template: '' });
      await testValid(entity);
    });

    it('should fail if template does not exist', async () => {
      const entity = createEntity({ template: nonExistentId.toString() });
      await expectError(entity, 'template does not exist', '.template');
    });

    it('should fail if title is not a string', async () => {
      let entity = createEntity({ title: {} });
      await expectError(entity, expect.any(String), '.title');
      entity = createEntity({ title: 10 });
      await expectError(entity, expect.any(String), '.title');
    });

    it('should fail if title exceeds the lucene term byte-length limit', async () => {
      const entity = createEntity({
        title: Math.random().toString(36).repeat(20000),
      });
      await expectError(entity, expect.any(String), '.title');
    });

    it('should allow title to be missing', async () => {
      const entity = createEntity({ title: undefined });
      await testValid(entity);
    });

    describe('metadata', () => {
      const largeField = Math.random().toString(36).repeat(20000);

      it('should not allow metadata keys that are not defined on the template properties', async () => {
        const entity = createEntity({
          metadata: {
            not_allowed_property: [],
            not_allowed_property2: [],
            name: [],
          },
        });

        await expectError(
          entity,
          customErrorMessages.property_not_allowed,
          ".metadata['not_allowed_property']"
        );

        await expectError(
          entity,
          customErrorMessages.property_not_allowed,
          ".metadata['not_allowed_property2']"
        );
      });

      it('should allow non-required properties to be missing', async () => {
        const entity = createEntity({
          metadata: {},
        });
        await testValid(entity);
      });

      describe('if no property is required', () => {
        it('should allow metadata object to be missing if there are not required properties', async () => {
          const entity = createEntity({ metadata: undefined });
          await testValid(entity);
        });

        it('should allow metadata object to be empty', async () => {
          const entity = createEntity({ template: simpleTemplateId, metadata: {} });
          await testValid(entity);
        });
      });

      describe('if property is required', () => {
        it('should fail if field does not exist', async () => {
          const template: TemplateSchema = {
            name: 'template with required props',
            properties: [
              { label: 'name', name: 'name', required: true, type: 'text' },
              { label: 'markdown', name: 'markdown', required: true, type: 'markdown' },
              { label: 'numeric', name: 'numeric', required: true, type: 'numeric' },
            ],
            commonProperties: [{ name: 'title', label: 'title', type: 'text' }],
          };
          const templateWithRequiredProps = await templates.save(template, 'en');

          let entity = createEntity({ template: templateWithRequiredProps._id });
          await expectError(entity, customErrorMessages.required, ".metadata['name']");
          entity = createEntity({
            template: templateWithRequiredProps._id,
            metadata: { name: [{ value: '' }] },
          });
          await expectError(entity, customErrorMessages.required, ".metadata['name']");
          entity = createEntity({
            template: templateWithRequiredProps._id,
            metadata: { name: [{ value: null }] },
          });
          await expectError(entity, customErrorMessages.required, ".metadata['name']");
          entity = createEntity({
            template: templateWithRequiredProps._id,
            metadata: { markdown: [] },
          });
          await expectError(entity, customErrorMessages.required, ".metadata['markdown']");
          entity = createEntity({
            template: templateWithRequiredProps._id,
            metadata: {
              name: [{ value: 'name' }],
              markdown: [{ value: 'markdown' }],
              numeric: [{ value: 0 }],
            },
          });
          await validateEntity(entity);
        });
      });

      describe('any property', () => {
        it('should fail if value is not an array', async () => {
          const entity = createEntity({ metadata: { name: { value: 10 } } });
          await expectError(entity, 'should be array', ".metadata['name']");
        });
      });

      describe('text property', () => {
        it('should fail if value is not a single string', async () => {
          let entity = createEntity({ metadata: { name: [{ value: 'a' }, { value: 'b' }] } });
          await expectError(entity, customErrorMessages[propertyTypes.text], ".metadata['name']");
          entity = createEntity({ metadata: { name: [{ value: 10 }] } });
          await expectError(entity, customErrorMessages[propertyTypes.text], ".metadata['name']");
        });

        it('should fail if value is a string that exceeds the lucene term byte-length limit', async () => {
          const entity = createEntity({ metadata: { name: [{ value: largeField }] } });
          await expectError(entity, 'maximum field length exceeded', ".metadata['name']");
        });
      });

      describe('markdown property', () => {
        it('should fail if value is not a string', async () => {
          const entity = createEntity({ metadata: { markdown: [{ value: 345 }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.markdown],
            ".metadata['markdown']"
          );
        });
        it('should fail if value is a string that exceeds the lucene term byte-length limit', async () => {
          const entity = createEntity({ metadata: { markdown: [{ value: largeField }] } });
          await expectError(entity, 'maximum field length exceeded', ".metadata['markdown']");
        });
      });

      describe('media property', () => {
        it('should fail if value is not a string', async () => {
          const entity = createEntity({ metadata: { media: [{ value: 10 }] } });
          await expectError(entity, customErrorMessages[propertyTypes.media], ".metadata['media']");
        });
      });

      describe('image property', () => {
        it('should fail if value is not a string', async () => {
          const entity = createEntity({ metadata: { image: [{ value: 10 }] } });
          await expectError(entity, customErrorMessages[propertyTypes.image], ".metadata['image']");
        });
      });

      describe('numeric property', () => {
        it('should fail if value is not a number', async () => {
          const entity = createEntity({ metadata: { numeric: [{ value: 'test' }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.numeric],
            ".metadata['numeric']"
          );
        });
        it('should allow value to be empty string', async () => {
          const entity = createEntity({ metadata: { numeric: [{ value: '' }] } });
          await testValid(entity);
        });
        it('should allow numbers passed as strings', async () => {
          const entity = createEntity({ metadata: { numeric: [{ value: '55' }] } });
          await testValid(entity);
        });
      });

      describe('date property', () => {
        it('should fail if value is not a number', async () => {
          let entity = createEntity({ metadata: { date: [{ value: 'test' }] } });
          await expectError(entity, customErrorMessages[propertyTypes.date], ".metadata['date']");
          entity = createEntity({ metadata: { date: [{ value: -100 }] } });
          await testValid(entity);
        });

        it('should allow value to be null if property is not required', async () => {
          const entity = createEntity({ metadata: { date: [{ value: null }] } });
          await testValid(entity);
        });
      });

      describe('multidate property', () => {
        it('should fail if value is not an array of numbers', async () => {
          let entity = createEntity({
            metadata: { multidate: [{ value: 100 }, { value: '200' }, { value: -5 }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.multidate],
            ".metadata['multidate']"
          );
          entity = createEntity({ metadata: { multidate: [{ value: '100' }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.multidate],
            ".metadata['multidate']"
          );
        });

        it('should allow null items', async () => {
          const entity = createEntity({
            metadata: {
              multidate: [{ value: 100 }, { value: null }, { value: 200 }, { value: null }],
            },
          });
          await testValid(entity);
        });
      });

      describe('daterange property', () => {
        it('should fail if value is not an object', async () => {
          let entity = createEntity({ metadata: { daterange: [{ value: 'dates' }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.daterange],
            ".metadata['daterange']"
          );
          entity = createEntity({
            metadata: { daterange: [{ value: 100 }, { value: 200 }, { value: -5 }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.daterange],
            ".metadata['daterange']"
          );
        });

        it('should allow either from or to to be null', async () => {
          let entity = createEntity({
            metadata: { daterange: [{ value: { from: null, to: 100 } }] },
          });
          await testValid(entity);
          entity = createEntity({ metadata: { daterange: [{ value: { from: 100, to: null } }] } });
          await testValid(entity);
          entity = createEntity({ metadata: { daterange: [{ value: { from: null, to: -100 } }] } });
          await testValid(entity);
          entity = createEntity({ metadata: { daterange: [{ value: { from: null, to: null } }] } });
          await testValid(entity);
        });

        it('should fail if from is greater than to', async () => {
          const entity = createEntity({
            metadata: { daterange: [{ value: { from: 100, to: 50 } }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.daterange],
            ".metadata['daterange']"
          );
        });
      });

      describe('multidaterange property', () => {
        it('should fail if value is not array of date ranges', async () => {
          let entity = createEntity({
            metadata: { multidaterange: [{ value: 100 }, { value: 200 }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.multidaterange],
            ".metadata['multidaterange']"
          );
          entity = createEntity({
            metadata: { multidaterange: [{ value: { from: 200, to: 100 } }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.multidaterange],
            ".metadata['multidaterange']"
          );
          entity = createEntity({
            metadata: { multidaterange: [{ value: { from: -200, to: -100 } }] },
          });
          await testValid(entity);
        });
      });

      describe('select property', () => {
        it('should fail if value is not string', async () => {
          const entity = createEntity({ metadata: { select: [{ value: 55 }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.select],
            ".metadata['select']"
          );
        });

        it('should allow empty string if property is not required', async () => {
          const entity = createEntity({ metadata: { markdown: [{ value: '' }] } });
          await testValid(entity);
        });

        it('should not allow foreign ids that do not exists', async () => {
          let entity = createEntity({
            metadata: {
              select: [{ value: 'non_existent_thesauri1' }],
            },
          });

          await expectError(
            entity,
            customErrorMessages.dictionary_wrong_foreing_id,
            ".metadata['select']",
            {
              data: [{ value: 'non_existent_thesauri1' }],
            }
          );

          entity = createEntity({
            metadata: {
              select: [{ value: 'dic1-value1' }],
            },
          });
          await testValid(entity);
        });
      });

      describe('multiselect property', () => {
        it('should fail if value is an empty string', async () => {
          const entity = createEntity({ metadata: { multiselect: [{ value: '' }] } });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.multiselect],
            ".metadata['multiselect']"
          );
        });

        it('should allow value to be an empty array', async () => {
          const entity = createEntity({ metadata: { multiselect: [] } });
          await testValid(entity);
        });

        it('should not allow foreign ids that do not exists', async () => {
          const entity = createEntity({
            metadata: {
              multiselect: [
                { value: 'dic1-value1' },
                { value: 'dic2-value2' },
                { value: 'non_existent_thesauri' },
              ],
            },
          });

          await expectError(
            entity,
            customErrorMessages.dictionary_wrong_foreing_id,
            ".metadata['multiselect']",
            {
              data: [{ value: 'dic1-value1' }, { value: 'non_existent_thesauri' }],
            }
          );
        });
      });

      describe('relationship property', () => {
        it('should fail if value is empty string', async () => {
          const entity = createEntity({
            metadata: { relationship: [{ value: '' }, { value: '' }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.relationship],
            ".metadata['relationship']"
          );
        });

        it('should not allow foreign ids that do not exists', async () => {
          const entity = createEntity({
            metadata: {
              relationship: [
                { value: 'entity1' },
                { value: 'non_existent_entity' },
                { value: 'non_existent_entity2' },
              ],
            },
          });

          await expectError(
            entity,
            customErrorMessages.relationship_wrong_foreign_id,
            ".metadata['relationship']",
            {
              data: [{ value: 'non_existent_entity' }, { value: 'non_existent_entity2' }],
            }
          );
        });

        it('should not allow foreign ids that do not belong to diferent template', async () => {
          const entity = createEntity({
            language: 'es',
            metadata: {
              relationship: [{ value: 'entity1' }, { value: 'entity2' }, { value: 'entity3' }],
            },
          });

          await expectError(
            entity,
            customErrorMessages.relationship_wrong_foreign_id,
            ".metadata['relationship']",
            {
              data: [{ value: 'entity2' }],
            }
          );
        });

        it('should fail if relationship fields with the same configuration have different values', async () => {
          const entity = createEntity({
            language: 'es',
            metadata: {
              relationship: [{ value: 'entity1' }, { value: 'entity3' }],
              relationship2: [{ value: 'entity1' }],
            },
          });

          await expectError(
            entity,
            customErrorMessages.relationship_values_should_match,
            ".metadata['relationship2']"
          );
        });
      });

      describe('link property', () => {
        it('should fail if value is not an object', async () => {
          const entity = createEntity({ metadata: { link: [{ value: 'bad_link' }] } });
          await expectError(entity, customErrorMessages[propertyTypes.link], ".metadata['link']");
        });

        it('should fail if url is not provided', async () => {
          let entity = createEntity({
            metadata: { link: [{ value: { label: 'label', url: '' } }] },
          });
          await expectError(entity, customErrorMessages[propertyTypes.link], ".metadata['link']");
        });

        it('should be ok if both are empty', async () => {
          const entity = createEntity({ metadata: { link: [{ value: { label: '', url: '' } }] } });
          await testValid(entity);
        });
        it('should be ok if label is empty', async () => {
          const entity = createEntity({
            metadata: { link: [{ value: { label: '', url: 'https://youtube.com' } }] },
          });
          await testValid(entity);
        });
      });

      describe('geolocation property', () => {
        it('should fail if value is not an array of lat/lon object', async () => {
          const entity = createEntity({
            metadata: { geolocation: [{ value: 'bad_geo' }] },
          });
          await expectError(
            entity,
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
        });

        it('should fail if label is not a string', async () => {
          const entity = createEntity({
            metadata: { geolocation: [{ value: { lat: 10, lon: 10, label: 10 } }] },
          });
          await expectError(entity, 'should be string', ".metadata['geolocation'][0].value");
        });

        it('should not fail if label is not present', async () => {
          const entity = createEntity({
            metadata: { geolocation: [{ value: { label: undefined, lat: 10, lon: 10 } }] },
          });
          await testValid(entity);
        });

        it('should fail if lat is not within range -90 - 90', async () => {
          let entity = createEntity({
            metadata: { geolocation: [{ value: { label: undefined, lat: -91, lon: 10 } }] },
          });
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
          entity = createEntity({
            metadata: { geolocation: [{ value: { label: undefined, lat: 91, lon: 10 } }] },
          });
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
        });

        it('should fail if lon is not within range -180 - 180', async () => {
          let entity = createEntity({
            metadata: { geolocation: [{ value: { label: undefined, lat: 10, lon: -181 } }] },
          });
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
          entity = createEntity({
            metadata: { geolocation: [{ value: { label: undefined, lat: 181, lon: 10 } }] },
          });
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
        });
      });
    });
  });
});
