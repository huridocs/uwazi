import {filterBaseProperties} from '../filterBaseProperties';

describe('filterBaseProperties', () => {
  it('should only retrun entity base data (omitting attachments, toc, etc.)', () => {
    const data = {
      _id: 'id',
      sharedId: 'sid',
      language: 'ln',
      metadata: 'metadata',
      template: 'tid',
      title: 'title',
      icon: 'icon',
      attachemnts: 'should not be sent',
      toc: 'should not be sent',
      file: 'should not be sent'
    };

    const expectedData = {
      _id: data._id,
      sharedId: data.sharedId,
      language: data.language,
      metadata: data.metadata,
      template: data.template,
      title: data.title,
      icon: data.icon
    };

    expect(filterBaseProperties(data)).toEqual(expectedData);
  });
});
