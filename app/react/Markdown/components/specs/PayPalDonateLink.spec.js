import React from 'react';
import { shallow } from 'enzyme';
import PayPalDonateLink from '../PayPalDonateLink.js';

describe('Link', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });
  it('should render a react-router Link with target _blank', () => {
    const component = shallow(
      <PayPalDonateLink currency="EUR" paypalid="1234">
        label
      </PayPalDonateLink>
    );
    expect(component).toMatchSnapshot();
  });

  it('should allow to set a custom amount', () => {
    const component = shallow(
      <PayPalDonateLink currency="EUR" paypalid="1234" amount="10.15">
        label
      </PayPalDonateLink>
    );
    expect(component).toMatchSnapshot();
  });

  it('should allow to set a custom class to the component', () => {
    const component = shallow(
      <PayPalDonateLink currency="EUR" paypalid="1234" className="custom class">
        label
      </PayPalDonateLink>
    );
    expect(component).toMatchSnapshot();
  });

  it('should allow nesting children inside', () => {
    const component = shallow(
      <PayPalDonateLink currency="EUR" paypalid="1234">
        <div>Extra content</div>
        <span>Label</span>
      </PayPalDonateLink>
    );
    expect(component).toMatchSnapshot();
  });
});
