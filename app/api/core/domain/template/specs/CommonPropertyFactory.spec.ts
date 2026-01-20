import { CommonPropertyFactory } from '#api/core/domain/template/CommonPropertyFactory.js';
import { CreationDateProperty } from '#api/core/domain/template/CreationDateProperty.js';
import { ModifiedDateProperty } from '#api/core/domain/template/ModifiedDateProperty.js';
import { TitleProperty } from '#api/core/domain/template/TitleProperty.js';

describe('CommonPropertyFactory', () => {
  it('should create an instance of TitleProperty', () => {
    const property = CommonPropertyFactory.create(
      {
        id: 'any',
        label: 'A text',
        type: 'text',
        template: 'any',
      },
      {}
    );

    expect(property).toBeInstanceOf(TitleProperty);
  });

  it('should create an instance of CreationDateProperty', () => {
    const property = CommonPropertyFactory.create(
      {
        id: 'any',
        label: 'A text',
        type: 'date',
        name: 'creationDate',
        template: 'any',
      },
      {}
    );

    expect(property).toBeInstanceOf(CreationDateProperty);
  });

  it('should create an instance of ModifiedDateProperty', () => {
    const property = CommonPropertyFactory.create(
      {
        id: 'any',
        label: 'A text',
        type: 'date',
        name: 'editDate',
        template: 'any',
      },
      {}
    );

    expect(property).toBeInstanceOf(ModifiedDateProperty);
  });
});
