import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {Item, mapStateToProps} from '../Item';

import {RowList, ItemFooter} from '../Lists';
import DocumentLanguage from '../DocumentLanguage';
import TemplateLabel from '../TemplateLabel';
import PrintDate from '../PrintDate';
import * as Icon from '../Icon';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

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
        creationDate: 123,
        snippets: []
      }),
      active: true,
      className: 'custom-class',
      onClick: jasmine.createSpy('onClick'),
      onSnippetClick: jasmine.createSpy('onSnippetClick'),
      onMouseEnter: jasmine.createSpy('onMouseEnter'),
      onMouseLeave: jasmine.createSpy('onMouseLeave'),
      additionalIcon: <div>additionalIcon</div>,
      buttons: <div>Buttons</div>,
      templates: Immutable([]),
      thesauris: Immutable([])
    };
  });

  let render = () => {
    component = shallow(<Item {...props} />);
  };

  it('should have default props values assigned', () => {
    render();
    expect(component.instance().props.search).toEqual(prioritySortingCriteria());
  });

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

  it('should call onSnippetClick when clicking on the snippet', () => {
    props.doc = Immutable({_id: 'id', snippets: [{text: 'snippet', page: 1}]});
    render();
    component.find('.item-snippet').simulate('click');
    expect(props.onSnippetClick).toHaveBeenCalled();
  });

  it('should include a header if present', () => {
    props.itemHeader = <div className="item-header">Item Header</div>;
    render();

    expect(component.find('.item-header').text()).toBe('Item Header');
  });

  it('should include additionalIcon, icon and title in the components name', () => {
    render();
    expect(component.find('.item-name').text()).toContain('additionalIcon');
    expect(component.find('.item-name').text()).toContain('doc title');
    expect(component.find('.item-name').find(Icon.default).props().data).toEqual({_id: 'icon', type: 'Icons'});
    expect(component.find('.item-name').find(DocumentLanguage).props().doc).toBe(props.doc);
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
        age: 25
      });
      props.thesauris = Immutable([{_id: 't1'}]);
    });

    it('should render upload date if no property is configured in the template to show in card', () => {
      props.search = {sort: 'title'};
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
      expect(component.find('.item-current-sort').text()).toContain('25');
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
      expect(component.find('.item-metadata').html()).toContain('<dd class="">value2</dd>');
    });

    it('should render multiple values separated by comas', () => {
      props.templates = Immutable([{
        _id: 'templateId',
        properties: [
          {name: 'sex', label: 'sexLabel', showInCard: true}
        ]
      }]);

      props.doc = props.doc.set('metadata', {
        sex: [{value: 'a'}, {value: 'b'}]
      });

      render();
      expect(component.find('.item-metadata').html()).toContain('a, b');
    });

    it('should render multiple values separated by <br /> if multidate or multidaterange', () => {
      props.templates = Immutable([{
        _id: 'templateId',
        properties: [
          {name: 'date', type: 'date', label: 'date', showInCard: true},
          {name: 'multidate', type: 'multidate', label: 'multidate', showInCard: true},
          {name: 'multidaterange', type: 'multidaterange', label: 'multidaterange', showInCard: true}
        ]
      }]);

      props.doc = props.doc.set('metadata', {
        date: [1, 1000],
        multidate: [10000, 100000],
        multidaterange: [{from: 1000000, to: 1200000}, {from: 2000000, to: 2200000}]
      });

      render();
      expect(component.find('.item-metadata').find('dd').at(0).html()).toContain(',');
      expect(component.find('.item-metadata').find('dd').at(1).html()).toContain('<br />');
      expect(component.find('.item-metadata').find('dd').at(2).html()).toContain('<br />');
    });
  });

  describe('when doc have no snippets', () => {
    it('should not render snippet secction when undefined', () => {
      props.doc = Immutable({
        type: 'entity',
        icon: {_id: 'icon', type: 'Icons'},
        title: 'doc title',
        template: 'templateId',
        creationDate: 123
      });

      render();
      expect(component.find('.item-snippet').length).toBe(0);
    });
    it('should not render snippet secction when empty', () => {
      props.doc = Immutable({
        type: 'entity',
        icon: {_id: 'icon', type: 'Icons'},
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: []
      });

      render();
      expect(component.find('.item-snippet').length).toBe(0);
    });
  });

  describe('when doc have snippets', () => {
    it('should render the first snippet of the document if exists', () => {
      props.doc = Immutable({
        type: 'entity',
        icon: {_id: 'icon', type: 'Icons'},
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: [{text: '<span>snippet!</span>', page: 1}]
      });

      render();
      expect(component.find('.item-snippet').html()).toContain('<span>snippet!</span>');
    });
  });

  describe('mapStateToProps', () => {
    let templates;
    let thesauris;
    let search;

    beforeEach(() => {
      templates = 'templates';
      thesauris = 'thesauris';
    });

    it('should include templates, thesauris and default sort', () => {
      expect(mapStateToProps({templates, thesauris}, {})).toEqual({templates, thesauris, search});
    });

    it('should allow overriding the default sort', () => {
      const ownProps = {searchParams: {sort: 'newSort'}};
      expect(mapStateToProps({templates, thesauris}, ownProps)).toEqual({templates, thesauris, search: {sort: 'newSort'}});
    });
  });
});
