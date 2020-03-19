/** @format */

/* eslint-disable max-lines,max-statements */

import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { validateEntity } from '../../../shared/types/entitySchema';
import { customErrorMessages } from '../metadataValidators.js';
import fixtures, { templateId, simpleTemplateId, nonExistentId } from './validatorFixtures';

describe('entity schema', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('validateEntity', () => {
    let entity;

    beforeEach(() => {
      entity = {
        _id: 'entity',
        sharedId: 'sharedId',
        title: 'Test',
        template: templateId.toString(),
        language: 'en',
        mongoLanguage: 'en',
        file: {
          originalname: 'file',
          filename: 'file',
          mimetype: 'pdf',
          size: 100,
          timestamp: 100,
          language: 'en',
        },
        attachments: [
          {
            originalname: 'att',
            filename: 'att',
            mimetype: 'doc',
            timestamp: 100,
            size: 100,
          },
        ],
        icon: {
          _id: 'icon',
          type: 'icon',
          label: 'Icon',
        },
        totalPages: 11,
        fullText: {
          1: 'this is[[1]] a test[[1]]',
        },
        creationDate: 100,
        processed: true,
        uploaded: true,
        published: false,
        pdfInfo: {
          1: {
            chars: 20,
          },
        },
        toc: [
          {
            range: { start: 100, end: 200 },
            label: 'Label',
            indentation: 0,
          },
        ],
        user: 'user',
        metadata: {
          name: [{ value: 'test' }],
          markdown: [{ value: 'rich text' }],
          image: [{ value: 'image' }],
          media: [{ value: 'https://youtube.com/foo' }],
          numeric: [{ value: 100 }],
          date: [{ value: 100 }],
          multidate: [{ value: 100 }, { value: 200 }],
          daterange: [{ value: { from: 100, to: 200 } }],
          multidaterange: [{ value: { from: 100, to: 200 } }, { value: { from: 1000, to: 2000 } }],
          geolocation: [{ value: { lat: 80, lon: 76, label: '' } }],
          select: [{ value: 'value' }],
          multiselect: [{ value: 'one' }, { value: 'two' }],
          required_multiselect: [{ value: 'one' }],
          relationship: [
            { icon: null, label: 'Daneryl', type: 'entity', value: '86raxe05i4uf2yb9' },
            { value: 'rel2', type: 'entity', icon: '213' },
          ],
          field_nested: [
            { value: { cadh: ['1.1', '25.1'], cipst: [], cbdp: [], cidfp: [] } },
            { value: { cadh: ['1.1', '21.1', '21.2', '25', '1'], cipst: [], cbdp: [], cidfp: [] } },
          ],
          link: [{ value: { label: 'label', url: 'url' } }],
          preview: [{ value: '' }],
        },
      };
    });

    const testValid = () => validateEntity(entity);

    const expectError = async (message, dataPath) => {
      await expect(validateEntity(entity)).rejects.toHaveProperty(
        'errors',
        expect.arrayContaining([expect.objectContaining({ dataPath, message })])
      );
    };

    it('should allow ObjectId for _id fields', async () => {
      entity._id = db.id();
      entity.user = db.id();
      entity.template = templateId;
      await testValid();
    });

    it('should allow removing the icon', async () => {
      entity.icon = { _id: null, type: 'Empty' };
      await testValid();
    });

    it('should allow template to be missing', async () => {
      delete entity.template;
      await testValid();
      entity.template = '';
      await testValid();
    });

    it('should fail if template does not exist', async () => {
      entity.template = nonExistentId.toString();
      await expectError('template does not exist', '.template');
    });

    it('should fail if title is not a string', async () => {
      entity.title = {};
      await expectError(expect.any(String), '.title');
      entity.title = 10;
      await expectError(expect.any(String), '.title');
    });

    it('should allow title to be missing', async () => {
      delete entity.title;
      await testValid();
    });

    describe('metadata', () => {
      it('should allow non-required properties to be missing', async () => {
        delete entity.metadata.geolocation;
        await testValid();
        delete entity.metadata.date;
        await testValid();
      });

      describe('if no property is required', () => {
        it('should allow metadata object to be missing if there are not required properties', async () => {
          entity.template = simpleTemplateId;
          delete entity.metadata;
          await testValid();
        });

        it('should allow metadata object to be empty', async () => {
          entity.template = simpleTemplateId;
          entity.metadata = {};
          await testValid();
        });
      });

      describe('if property is required', () => {
        it('should fail if field does not exist', async () => {
          delete entity.metadata.name;
          await expectError(customErrorMessages.required, ".metadata['name']");
          entity.metadata.name = [{ value: '' }];
          await expectError(customErrorMessages.required, ".metadata['name']");
          entity.metadata.name = [{ value: null }];
          await expectError(customErrorMessages.required, ".metadata['name']");
          entity.metadata.required_multiselect = [];
          await expectError(customErrorMessages.required, ".metadata['required_multiselect']");
        });
      });

      describe('any property', () => {
        it('should fail if value is not an array', async () => {
          entity.metadata.name = { value: 10 };
          await expectError(customErrorMessages.required, ".metadata['name']");
        });
      });

      describe('text property', () => {
        it('should fail if value is not a single string', async () => {
          entity.metadata.name = [{ value: 'a' }, { value: 'b' }];
          await expectError(customErrorMessages[propertyTypes.text], ".metadata['name']");
          entity.metadata.name = [{ value: 10 }];
          await expectError(customErrorMessages[propertyTypes.text], ".metadata['name']");
        });
      });

      describe('markdown property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.markdown = [{ value: {} }];
          await expectError(customErrorMessages[propertyTypes.markdown], ".metadata['markdown']");
        });
      });

      describe('media property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.media = [{ value: 10 }];
          await expectError(customErrorMessages[propertyTypes.media], ".metadata['media']");
        });
      });

      describe('image property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.image = [{ value: 10 }];
          await expectError(customErrorMessages[propertyTypes.image], ".metadata['image']");
        });
      });

      describe('numeric property', () => {
        it('should fail if value is not a number', async () => {
          entity.metadata.numeric = [{ value: 'test' }];
          await expectError(customErrorMessages[propertyTypes.numeric], ".metadata['numeric']");
        });
        it('should allow value to be empty string', async () => {
          entity.metadata.numeric = [{ value: '' }];
          await testValid();
        });
      });

      describe('date property', () => {
        it('should fail if value is not a number', async () => {
          entity.metadata.date = [{ value: 'test' }];
          await expectError(customErrorMessages[propertyTypes.date], ".metadata['date']");
          entity.metadata.date = [{ value: -100 }];
          await testValid();
        });

        it('should allow value to be null if property is not required', async () => {
          entity.metadata.date = [{ value: null }];
          await testValid();
        });
      });

      describe('multidate property', () => {
        it('should fail if value is not an array of numbers', async () => {
          entity.metadata.multidate = [{ value: 100 }, { value: '200' }, { value: -5 }];
          await expectError(customErrorMessages[propertyTypes.multidate], ".metadata['multidate']");
          entity.metadata.multidate = [{ value: '100' }];
          await expectError(customErrorMessages[propertyTypes.multidate], ".metadata['multidate']");
          entity.metadata.multidate = { value: 100 };
          await expectError(customErrorMessages[propertyTypes.multidate], ".metadata['multidate']");
        });

        it('should allow null items', async () => {
          entity.metadata.multidate = [
            { value: 100 },
            { value: null },
            { value: 200 },
            { value: null },
          ];
          await testValid();
        });
      });

      describe('daterange property', () => {
        it('should fail if value is not an object', async () => {
          entity.metadata.daterange = [{ value: 'dates' }];
          await expectError(customErrorMessages[propertyTypes.daterange], ".metadata['daterange']");
          entity.metadata.daterange = [{ value: 100 }, { value: 200 }, { value: -5 }];
          await expectError(customErrorMessages[propertyTypes.daterange], ".metadata['daterange']");
        });

        it('should allow either from or to to be null', async () => {
          entity.metadata.daterange = [{ value: { from: null, to: 100 } }];
          await testValid();
          entity.metadata.daterange = [{ value: { from: 100, to: null } }];
          await testValid();
          entity.metadata.daterange = [{ value: { from: null, to: -100 } }];
          await testValid();
          entity.metadata.daterange = [{ value: { from: null, to: null } }];
          await testValid();
        });

        it('should fail if from and to are not numbers', async () => {
          entity.metadata.daterange = [{ value: { from: 'test', to: 'test' } }];
          await expectError(customErrorMessages[propertyTypes.daterange], ".metadata['daterange']");
        });

        it('should fail if from is greater than to', async () => {
          entity.metadata.daterange = [{ value: { from: 100, to: 50 } }];
          await expectError(customErrorMessages[propertyTypes.daterange], ".metadata['daterange']");
        });
      });

      describe('multidaterange property', () => {
        it('should fail if value is not array of date ranges', async () => {
          entity.metadata.multidaterange = [{ value: { from: 100, to: '200' } }];
          await expectError(
            customErrorMessages[propertyTypes.multidaterange],
            ".metadata['multidaterange']"
          );
          entity.metadata.multidaterange = [{ value: 100 }, { value: 200 }];
          await expectError(
            customErrorMessages[propertyTypes.multidaterange],
            ".metadata['multidaterange']"
          );
          entity.metadata.multidaterange = [{ value: { from: 200, to: 100 } }];
          await expectError(
            customErrorMessages[propertyTypes.multidaterange],
            ".metadata['multidaterange']"
          );
          entity.metadata.multidaterange = [{ value: { from: -200, to: -100 } }];
          await testValid();
        });
      });

      describe('select property', () => {
        it('should fail if value is not a non-empty string', async () => {
          entity.metadata.select = [{ value: 10 }];
          await expectError(customErrorMessages[propertyTypes.select], ".metadata['select']");
          entity.metadata.select = [{ value: ['test'] }];
          await expectError(customErrorMessages[propertyTypes.select], ".metadata['select']");
        });
        it('should allow empty string if property is not required', async () => {
          entity.metadata.select = [{ value: '' }];
          await testValid();
        });
      });

      describe('multiselect property', () => {
        it('should fail if value is not an array of non-empty strings', async () => {
          entity.metadata.multiselect = ['val1', 10, {}];
          await expectError(
            customErrorMessages[propertyTypes.multiselect],
            ".metadata['multiselect']"
          );
          entity.metadata.multiselect = ['one', '', 'two'];
          await expectError(
            customErrorMessages[propertyTypes.multiselect],
            ".metadata['multiselect']"
          );
        });
        it('should allow value to be an empty array', async () => {
          entity.metadata.multiselect = [];
          await testValid();
        });
      });

      describe('relationship property', () => {
        it('should fail if value is not an array of non-empty strings', async () => {
          entity.metadata.relationship = [{ value: 'val1' }, { value: 10 }, {}];
          await expectError(
            customErrorMessages[propertyTypes.relationship],
            ".metadata['relationship']"
          );
          entity.metadata.relationship = [{ value: 'one' }, { value: '' }, { value: 'two' }];
          await expectError(
            customErrorMessages[propertyTypes.relationship],
            ".metadata['relationship']"
          );
        });
      });

      describe('link property', () => {
        it('should fail if value is not an object', async () => {
          entity.metadata.link = ['label', 'url'];
          await expectError(customErrorMessages[propertyTypes.link], ".metadata['link']");
        });

        it('should fail if label or url are not provided', async () => {
          entity.metadata.link = [{ value: { label: 'label', url: '' } }];
          await expectError(customErrorMessages[propertyTypes.link], ".metadata['link']");
          entity.metadata.link = [{ value: { label: '', url: 'url' } }];
          await expectError(customErrorMessages[propertyTypes.link], ".metadata['link']");
        });

        it('should fail if label or url is not a string', async () => {
          entity.metadata.link = [{ value: { label: 'label', url: 10 } }];
          await expectError(customErrorMessages[propertyTypes.link], ".metadata['link']");
          entity.metadata.link = [{ value: { label: true, url: 'url' } }];
          await expectError(customErrorMessages[propertyTypes.link], ".metadata['link']");
        });

        it('should be ok if both are empty', async () => {
          entity.metadata.link = [{ value: { label: '', url: '' } }];
          await testValid();
        });
      });

      describe('geolocation property', () => {
        it('should fail if value is not an array of lat/lon object', async () => {
          entity.metadata.geolocation = { value: { lat: 80, lon: 80, label: '' } };
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
        });
        it('should fail if lat or lon are not numbers', async () => {
          entity.metadata.geolocation = [{ value: { lat: '', lon: 80, label: '' } }];
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
          entity.metadata.geolocation = [{ value: { lat: 80, lon: '', label: '' } }];
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
        });
        it('should fail if label is not a string', async () => {
          entity.metadata.geolocation[0].value.label = 10;
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
        });
        it('should fail if lat or lon is missing', async () => {
          entity.metadata.geolocation = [{ value: { lon: 80, label: '' } }];
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
          entity.metadata.geolocation = [{ value: { lat: 80, label: '' } }];
          await expectError(
            customErrorMessages[propertyTypes.geolocation],
            ".metadata['geolocation']"
          );
        });
        it('should fail if lat is not within range -90 - 90', async () => {
          entity.metadata.geolocation[0].value.lat = -91;
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
          entity.metadata.geolocation[0].value.lat = 91;
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
        });
        it('should fail if lon is not within range -180 - 180', async () => {
          entity.metadata.geolocation[0].value.lon = -181;
          await expect(validateEntity(entity)).rejects.toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({ dataPath: ".metadata['geolocation'][0].value" }),
            ])
          );
          entity.metadata.geolocation[0].value.lon = 181;
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
