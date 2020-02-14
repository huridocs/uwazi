import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import ActivitylogRow from '../ActivitylogRow';

jest.mock('moment', function baseCall() {
  function format(formatString) {
    return `formatted: ${this.initialDate}, with: ${formatString} (locale: ${this.locale});`;
  }

  function locale(localeString) {
    this.locale = localeString;
    return {
      format: format.bind(this),
    };
  }

  function moment(initialDate) {
    this.initialDate = initialDate;
    this.locale = null;
    return {
      format: format.bind(this),
      locale: locale.bind(this),
    };
  }

  return moment.bind(this);
});

describe('ActivitylogRow', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {
      entry: Immutable.fromJS({
        semantic: { beautified: false },
        url: '/api/entities',
        method: 'POST',
        time: '12345',
      }),
    };
  });

  const render = () => {
    component = shallow(<ActivitylogRow {...props} />);
  };

  it('should render the component when not beautified', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when beautified', () => {
    beforeEach(() => {
      props.entry = props.entry
        .set(
          'semantic',
          Immutable.fromJS({
            beautified: true,
            description: 'descrip',
            name: 'name',
            extra: 'extra',
          })
        )
        .set('time', '54321');
    });

    const prepareAction = action => {
      props.entry = props.entry
        .setIn(['semantic', 'action'], action)
        .set('username', 'defined user');
      render();
    };

    it('should render the componet for the different actions', () => {
      prepareAction('CREATE');
      expect(component).toMatchSnapshot();
      prepareAction('UPDATE');
      expect(component).toMatchSnapshot();
      prepareAction('DELETE');
      expect(component).toMatchSnapshot();
      prepareAction('CUSTOM');
      expect(component).toMatchSnapshot();
    });
  });

  describe('toggleExpand', () => {
    const toggle = instance => {
      instance.toggleExpand();
      component.update();
    };

    it('should alternate the expand value', () => {
      const instance = component.instance();
      expect(component.state().expanded).toBe(false);
      toggle(instance);
      expect(component.state().expanded).toBe(true);
      toggle(instance);
      expect(component.state().expanded).toBe(false);
    });
  });
});
