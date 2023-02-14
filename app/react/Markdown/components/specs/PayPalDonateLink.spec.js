import React from 'react';
import { shallow } from 'enzyme';
import PayPalDonateLink from '../PayPalDonateLink.js';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types
  Link: props => <a {...props} href={props.to} />,
}));

describe('Link', () => {
  beforeEach(() => {
    spyOn(console, 'warn');
  });
  it('should render a react-router-dom Link with target _blank', () => {
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
