import Ajv from 'ajv';
import validator from '../entitiesValidator';

describe('entitiesValidator', () => {
  let entity;
  
  describe('save', () => {
    let entity;

    beforeEach(() => {
      entity = {
        _id: 'entity',
        sharedId: 'sharedId',
        title: 'Test',
        template: 'tpl',
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
          num: 100,
          geo: [{ lat: 80, lon: 76 }],
          list: ['one', 'two'],
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

    describe('metadata', () => {
      it('should fail if metadata has unsupported value type', async () => {
        entity.metadata.test = [false, true];
        await testInvalid();
      });
    });
  });
});
