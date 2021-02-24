import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { CollectionSettings } from '../CollectionSettingsV2';

describe('Collection settings', () => {
  let component: ShallowWrapper<typeof CollectionSettings>;

  it('should allow custom landing page', () => {
    component = shallow(<CollectionSettings />);
  });
});
