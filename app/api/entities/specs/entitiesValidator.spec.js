import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';
import validator from '../entitiesValidator';
import fixtures, { templateId, nonExistentId } from './validatorFixtures';

describe('entitiesValidator', () => {

  beforeEach(done => {
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });
  
  describe('save', () => {
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
          language: 'en'
        },
        attachments: [
          {
            originalname: 'att',
            filename: 'att',
            mimetype: 'doc',
            timestamp: 100,
            size: 100
          }
        ],
        icon: {
          _id: 'icon',
          type: 'icon',
          label: 'Icon'
        },
        totalPages: 11,
        fullText: {
          1: 'this is[[1]] a test[[1]]'
        },
        creationDate: 100,
        processed: true,
        uploaded: true,
        published: false,
        pdfInfo: {
          1: {
            chars: 20
          }
        },
        user: 'user',
        metadata: {
          name: 'test',
          markdown: 'rich text',
          // image: 'image',
          media: 'https://youtube.com/foo',
          numeric: 100,
          date: 100,
          multidate: [100, 200],
          daterange: { from: 100, to: 200 },
          multidaterange: [{ from: 100, to: 200 }, { from: 1000, to: 2000 }],
          geolocation: [{ lat: 80, lon: 76, label: '' }],
          select: 'value',
          multiselect: ['one', 'two'],
          relationship: ['rel1', 'rel2'],
          link: { label: 'label', url: 'url' },
          preview: ''
        }
      }
    });

    const testValid = () => validator.save(entity, 'en');

    const testInvalid = async () => {
      try {
        await validator.save(entity, 'en');
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    };

    it('should validate entity', async () => {
      await testValid();
    });

    it('should fail if template does not exist', async () => {
      entity.template = nonExistentId.toString();
      await testInvalid();
    });

    it('should fail if title is not a non-empty string', async () => {
      delete entity.title;
      await testInvalid();
      entity.title = '';
      await testInvalid();
      entity.title = 10;
      await testInvalid();
    });

    describe('metadata', () => {
      it('should fail if metadata has unsupported value type', async () => {
        entity.metadata.test = [false, true];
        await testInvalid();
      });

      it('should allow non-required properties to be missing', async () => {
        delete entity.metadata.geolocation;
        await testValid();
      });

      describe('if property is required', () => {
        it('should fail if field does not exist', async () => {
          delete entity.metadata.name;
          await testInvalid();
        });
      });

      describe('text property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.name = 10;
          await testInvalid();
        });
      });

      describe('markdown property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.markdown = {};
          await testInvalid();
        });
      });

      describe('media property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.media = 10;
          await testInvalid();
        });
      });

      describe('image property', () => {
        it('should fail if value is not a string', async () => {
          entity.metadata.image = 10;
          await testInvalid();
        });
      });

      describe('numeric property', () => {
        it('should fail if value is not a number', async () => {
          entity.metadata.numeric = 'test';
          await testInvalid();
        });
      });

      describe('date property', () => {
        it('should fail if value is not a positive number', async () => {
          entity.metadata.date = 'test';
          await testInvalid();
          entity.metadata.date = -100;
          await testInvalid();
        });
      });

      describe('multidate property', () => {
        it('should fail if value is not an array of numbers', async () => {
          entity.metadata.multidate = [100, '200'];
          await testInvalid();
          entity.metadata.multidate = ['100'];
          await testInvalid();
          entity.metadata.multidate = 100;
          await testInvalid();
        });
      });

      describe('daterange property', () => {
        it('should fail if value is not an object', async () => {
          entity.metadata.daterange = 'dates';
          await testInvalid();
          entity.metadata.daterange = [100, 200];
          await testInvalid();
        });

        it('should allow either from or to to be null but not both', async () => {
          entity.metadata.daterange = { from: null, to: 100 };
          await testValid();
          entity.metadata.daterange = { from: 100, to: null };
          await testValid();
          entity.metadata.daterange = { from: null, to: null };
          await testInvalid();
        });
        it('should fail if from and to are not numbers', async () => {
          entity.metadata.daterange.from = 'test',
          entity.metadata.daterange.to = 'test';
          await testInvalid();
        });
        it('should fail if from is greater than to', async () => {
          entity.metadata.daterange.from = 100,
          entity.metadata.daterange.to = 50;
          await testInvalid();
        });
      });

      describe('multidaterange property', () => {
        it('should fail if value is not array of date ranges', async () => {
          entity.metadata.multidaterange = [{ from: 100, to: '200' }];
          await testInvalid();
          entity.metadata.multidaterange = [100, 200];
          await testInvalid();
          entity.metadata.multidaterange = [{ from: 200, to: 100 }];
          await testInvalid();
        });
      });

      describe('select property', () => {
        it('should fail if value is not a non-empty string', async () => {
          entity.metadata.select = 10;
          await testInvalid();
          entity.metadata.select = ['test'];
          await testInvalid();
          entity.metadata.select = '';
          await testInvalid();
        });
      });

      describe('multiselect property', () => {
        it('should fail if value is not an array of non-empty strings', async () => {
          entity.metadata.multiselect = ['val1', 10, {}];
          await testInvalid();
          entity.metadata.multiselect = ['one', '', 'two'];
          await testInvalid();
        });
      });

      describe('relationship property', () => {
        it('should fail if value is not an array of non-empty strings', async () => {
          entity.metadata.relationship = ['val1', 10, {}];
          await testInvalid();
          entity.metadata.relationship = ['one', '', 'two'];
          await testInvalid();
        });
      });

      describe('link property', () => {
        it('should fail if value is not an object', async () => {
          entity.metadata.link = ['label', 'url'];
          await testInvalid();
        });

        it('should fail if label or url are not provided', async () => {
          entity.metadata.link = { label: 'label', url: '' };
          await testInvalid();
          entity.metadata.link = { label: 'label' };
          await testInvalid();
          entity.metadata.link = { label: '', url: 'url' };
          await testInvalid();
          entity.metadata.link = { url: 'url' };
          await testInvalid();
        });

        it('should fail if label or url is not a string', async () => {
          entity.metadata.link = { label: 'label', url: 10 };
          await testInvalid();
          entity.metadata.link = { label: true, url: 'url' };
          await testInvalid();
        });
      });

      describe('geolocation property', () => {
        it('should fail if value is not an array of lat/lon object', async () => {
          entity.metadata.geolocation = { lat: 80, lon: 80, label: '' };
          await testInvalid();
          entity.metadata.geolocation = [80, 90];
          await testInvalid();
        });
        it('should fail if lat or lon are not numbers', async () => {
          entity.metadata.geolocation = [{ lat: '', lon: 80, label: '' }];
          await testInvalid();
          entity.metadata.geolocation = [{ lat: 80, lon: '', label: '' }];
          await testInvalid();
        });
        it('should fail if label is not a string', async () => {
          entity.metadata.geolocation[0].label = 10;
          await testInvalid();
        });
        it('should fail if lat or lon is missing', async () => {
          entity.metadata.geolocation = [{ lon: 80, label: '' }];
          await testInvalid();
          entity.metadata.geolocation = [{ lat: 80, label: '' }];
          await testInvalid();
        });
        it('should fail if lat is not within range -90 - 90', async () => {
          entity.metadata.geolocation[0].lat = -91;
          await testInvalid();
          entity.metadata.geolocation[0].lat = 91;
          await testInvalid();
        });
        it('should fail if lon is not within range -180 - 180', async () => {
          entity.metadata.geolocation[0].lon = -181;
          await testInvalid();
          entity.metadata.geolocation[0].lon = 181;
          await testInvalid();
        });
      });

    });
  });
});
