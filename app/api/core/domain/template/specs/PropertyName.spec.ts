import { PropertyName } from '../PropertyName';

describe('PropertyName', () => {
  it('when creating should format the provided label (old name generation)', () => {
    const propertyName = PropertyName.fromLabel('A title with _ and  space', {
      newNameGeneration: false,
    });

    expect(propertyName.value).toBe('a_title_with___and__space');
  });

  it('when creating should format the provided label (new name generation)', () => {
    const propertyName = PropertyName.fromLabel('A title with _ and  space', {
      newNameGeneration: true,
    });

    expect(propertyName.value).toBe('a_title_with___and__space');
  });
});
