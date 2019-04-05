import { removeEntityFilenames } from '../utils';

describe('entities utils', () => {
  describe('removeEntityFilenames', () => {
    it('should remove filename from main file and attachments for entity', () => {
      const entities = [
        {
          sharedId: 'ent1',
          file: { filename: 'main.pdf', originalname: 'Main.pdf' },
          attachments: [
            { _id: 'att1', filename: 'att1.doc', originalname: 'Attachment 1.doc' }
          ]
        },
        {
          sharedId: 'ent2',
          file: { filename: 'main2.pdf', originalname: 'Main 2.pdf' },
          attachments: [
            { _id: 'att2', filename: 'att2.doc', originalname: 'Attachment 2.doc' }
          ]
        }
      ];
      const res = removeEntityFilenames(entities);
      expect(res).toMatchSnapshot();
    });
  });
});
