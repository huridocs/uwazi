import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';

describe('URLAttachment', () => {
  describe('hasContent', () => {
    it('should always be false even if passing content on the constructor', async () => {
      expect(FileBuilder.urlAttachment('attachment_id').hasContent()).toBe(false);
      expect(
        FileBuilder.urlAttachment('attachment_id', {
          //@ts-ignore
          content: FileBuilder.content('content'),
        }).hasContent()
      ).toBe(false);
    });
  });
});
