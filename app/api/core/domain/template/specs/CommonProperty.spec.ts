import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
import { CommonPropertyInvalidError } from '../errors';

describe('CommonProperty', () => {
  it('should set defaults values if not provided', () => {
    const commonProperty = new CommonProperty({
      id: 'any_id',
      label: 'A Title',
      type: 'text',
      template: 'any',
    });

    expect(commonProperty).toMatchObject({
      isCommonProperty: true,
    });
  });

  it('should throw if providing isCommonProperty equals to false', () => {
    expect(
      () =>
        new CommonProperty({
          id: 'any',
          isCommonProperty: false,
          label: 'A label',
          type: 'date',
          template: '',
        })
    ).toThrow(new CommonPropertyInvalidError());
  });
});
