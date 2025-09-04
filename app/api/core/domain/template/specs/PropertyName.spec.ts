import { PropertyName } from '../PropertyName';

describe('PropertyName', () => {
  it('when creating should format the provided label', () => {
    const propertyName = PropertyName.fromLabel('A title with _ and  space');

    expect(propertyName.value).toBe('a_title_with___and__space');
  });
});
