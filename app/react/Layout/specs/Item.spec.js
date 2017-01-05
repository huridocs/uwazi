import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {Item} from '../Item';

import {RowList, ItemFooter} from '../Lists';
import TemplateLabel from '../TemplateLabel';
import PrintDate from '../PrintDate';
import * as Icon from '../Icon';

describe('Item', () => {
  let component;
  let props;

  beforeEach(() => {
    Icon.default = Icon.Icon;
    props = {
      doc: Immutable({
        type: 'entity',
        icon: {_id: 'icon', type: 'Icons'},
        title: 'doc title',
        template: 'templateId',
        creationDate: 123
      }),
      active: true,
      className: 'custom-class',
      onClick: jasmine.createSpy('onClick'),
      onMouseEnter: jasmine.createSpy('onMouseEnter'),
      onMouseLeave: jasmine.createSpy('onMouseLeave'),
      additionalIcon: <div>additionalIcon</div>,
      buttons: <div>Buttons</div>,
      templates: Immutable([]),
      thesauris: Immutable([]),
      search: {sort: 'property_name'}
    };
  });

  let render = () => {
    component = shallow(<Item {...props} />);
  };

  it('should extend RowList.Item and append active, type and classNames correctly', () => {
    render();
    expect(component.find(RowList.Item).props().className).toContain('item-entity');
    expect(component.find(RowList.Item).props().className).toContain('custom-class');
    expect(component.find(RowList.Item).props().active).toBe(true);
  });

  it('should replicate onClick, onMouseEnter and onMouseLeave behaviours of parent', () => {
    render();
    component.find(RowList.Item).simulate('click');
    expect(props.onClick).toHaveBeenCalled();

    component.find(RowList.Item).simulate('mouseEnter');
    expect(props.onMouseEnter).toHaveBeenCalled();

    component.find(RowList.Item).simulate('mouseLeave');
    expect(props.onMouseLeave).toHaveBeenCalled();
  });

  it('should include additionalIcon, icon and title in the components name', () => {
    render();
    expect(component.find('.item-name').text()).toContain('additionalIcon');
    expect(component.find('.item-name').text()).toContain('doc title');
    expect(component.find('.item-name').find(Icon.default).props().data).toEqual({_id: 'icon', type: 'Icons'});
  });

  it('should include a template label and custom buttons inside the footer', () => {
    render();
    expect(component.find(ItemFooter).find(TemplateLabel).props().template).toBe('templateId');
    expect(component.find(ItemFooter).find('div').at(1).text()).toContain('Buttons');
  });

  describe('Metadata', () => {
    beforeEach(() => {
      props.doc = props.doc.set('metadata', {
        sex: 'female',
        age: '25'
      });
      props.thesauris = Immutable([{_id: 't1'}]);
    });

    it('should render upload date if no property is configured in the template to show in card', () => {
      render();
      expect(component.find('.item-metadata').text()).toContain('Date added');
      expect(component.find('.item-metadata').find(PrintDate).props().utc).toBe(123);
    });

    it('should render metadata if configured in template', () => {
      props.templates = Immutable([{
        _id: 'templateId',
        properties: [
          {name: 'sex', label: 'sexLabel', showInCard: true},
          {name: 'age', label: 'ageLabel'}
        ]
      }]);

      render();
      expect(component.find('.item-metadata').text()).toContain('sexLabel');
      expect(component.find('.item-metadata').text()).toContain('female');
      expect(component.find('.item-metadata').text()).not.toContain('ageLabel');
    });

    it('should render metadata if selected in search.sort', () => {
      props.templates = Immutable([{
        _id: 'templateId',
        properties: [
          {name: 'sex', label: 'sexLabel', showInCard: true},
          {name: 'age', label: 'ageLabel'}
        ]
      }]);

      props.search = {sort: 'metadata.age'};

      render();

      expect(component.find('.item-metadata').text()).toContain('sexLabel');
      expect(component.find('.item-metadata').text()).toContain('female');
      expect(component.find('.item-metadata').text()).toContain('ageLabel');
    });

    it('should render additional metadata if passed', () => {
      props.templates = Immutable([{
        _id: 'templateId',
        properties: [
          {name: 'sex', label: 'sexLabel'},
          {name: 'age', label: 'ageLabel'}
        ]
      }]);

      props.additionalMetadata = [
        {label: 'label1', value: 'value1', icon: {_id: 'customIcon', type: 'Icons'}},
        {label: 'label2', value: 'value2'}
      ];

      render();
      expect(component.find('.item-metadata').html()).toContain('<dt>label1</dt>');
      expect(component.find('.item-metadata').html()).toContain('customIcon');
      expect(component.find('.item-metadata').html()).toContain('value1');
      expect(component.find('.item-metadata').html()).toContain('<dt>label2</dt>');
      expect(component.find('.item-metadata').html()).toContain('<dd>value2</dd>');
    });
  });
});
