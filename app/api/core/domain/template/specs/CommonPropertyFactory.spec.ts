import { CommonPropertyFactory } from '../CommonPropertyFactory';
import { CreationDateProperty } from '../CreationDateProperty';
import { ModifiedDateProperty } from '../ModifiedDateProperty';
import { TitleProperty } from '../TitleProperty';

describe('CommonPropertyFactory', () => {
  it('should create an instance of TitleProperty', () => {
    const titleProperty = CommonPropertyFactory.create({
      id: 'any',
      label: 'A text',
      type: 'text',
    });

    expect(titleProperty).toBeInstanceOf(TitleProperty);
  });

  it('should create an instance of CreationDateProperty', () => {
    const titleProperty = CommonPropertyFactory.create({
      id: 'any',
      label: 'A text',
      type: 'date',
      name: 'creationDate',
    });

    expect(titleProperty).toBeInstanceOf(CreationDateProperty);
  });

  it('should create an instance of ModifiedDateProperty', () => {
    const titleProperty = CommonPropertyFactory.create({
      id: 'any',
      label: 'A text',
      type: 'date',
      name: 'editDate',
    });

    expect(titleProperty).toBeInstanceOf(ModifiedDateProperty);
  });
});
