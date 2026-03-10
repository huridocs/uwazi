import { CommonPropertyFactory } from '../CommonPropertyFactory';
import { CreationDateProperty } from '../CreationDateProperty';
import { ModifiedDateProperty } from '../ModifiedDateProperty';
import { TitleProperty } from '../TitleProperty';

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
