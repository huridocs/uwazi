import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { ActivitylogRow } from '../ActivitylogRow';
import DescriptionWrapper from '../DescriptionWrapper';

jest.mock('moment-timezone', () => {});

jest.mock('moment', () => {
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

  return moment.bind(moment);
});

describe('ActivitylogRow', () => {
  let props;
  let component;

  beforeEach(() => {
    props = {
      entry: Immutable.fromJS({
        _id: 'post1',
        semantic: { action: 'RAW', extra: 'POST: /api/entities' },
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

    const prepareAction = (action, username = 'defined user') => {
      props.entry = props.entry.setIn(['semantic', 'action'], action).set('username', username);
      render();
    };

    it('should render the componet for the different actions', () => {
      prepareAction('CREATE');
      expect(component).toMatchSnapshot();
      prepareAction('UPDATE');
      expect(component).toMatchSnapshot();
      prepareAction('DELETE');
      expect(component).toMatchSnapshot();
      prepareAction('MIGRATE');
      expect(component).toMatchSnapshot();
      prepareAction('CUSTOM');
      expect(component).toMatchSnapshot();
    });

    it('should render as anonymous when username is empty', () => {
      prepareAction('CREATE', null);
      const userNameColumn = component.find('tr > td');
      expect(userNameColumn.get(1).props.children).toBe('anonymous');
      expect(userNameColumn.get(1).props.className).toBe('color-0');
    });
  });

  describe('toggleExpand', () => {
    it('should alternate the expand value', () => {
      render();
      const description = component.find(DescriptionWrapper);
      expect(description.at(0).props().expanded).toBe(false);

      description.at(0).props().toggleExpand();
      component.update();

      const actualDescription = component.find(DescriptionWrapper);
      expect(actualDescription.at(0).props().expanded).toBe(true);
    });
  });
});
