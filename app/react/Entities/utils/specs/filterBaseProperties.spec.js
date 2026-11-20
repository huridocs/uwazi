import util from '../filterBaseProperties.js';

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
      file: 'should not be sent',
    };

    const expectedData = {
      _id: data._id,
      sharedId: data.sharedId,
      language: data.language,
      metadata: data.metadata,
      template: data.template,
      title: data.title,
      icon: data.icon,
    };

    expect(util.filterBaseProperties(data)).toEqual(expectedData);
  });

  it('keeps metadata attributes so a sidepanel save can reattach them', () => {
    const metadataAttributes = {
      text: { values: ['old'], attributes: [['ai_generated']] },
    };
    const data = {
      title: 'title',
      metadata: { text: 'edited' },
      metadataAttributes,
      toc: 'should not be sent',
    };

    expect(util.filterBaseProperties(data).metadataAttributes).toEqual(metadataAttributes);
    expect(util.filterBaseProperties(data)).not.toHaveProperty('toc');
  });
});
