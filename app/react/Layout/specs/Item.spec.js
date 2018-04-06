import { fromJS as Immutable } from 'immutable';
import React from 'react';

import { get as prioritySortingCriteria } from 'app/utils/prioritySortingCriteria';
import { shallow } from 'enzyme';

import { FormatMetadata } from '../../Metadata';
import { Item, mapStateToProps } from '../Item';
import { RowList, ItemFooter } from '../Lists';
import DocumentLanguage from '../DocumentLanguage';
import * as Icon from '../Icon';
import TemplateLabel from '../TemplateLabel';

describe('Item', () => {
  let component;
  let props;

  beforeEach(() => {
    Icon.default = Icon.Icon;
    props = {
      doc: Immutable({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
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

  const render = () => {
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
    props.doc = Immutable({ _id: 'id', snippets: [{ text: 'snippet', page: 1 }] });
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
    expect(component.find('.item-name').find(Icon.default).props().data).toEqual({ _id: 'icon', type: 'Icons' });
    expect(component.find('.item-name').find(DocumentLanguage).props().doc).toBe(props.doc);
  });

  it('should accept a different property name for the title', () => {
    props.doc = props.doc.set('label', 'label as title');
    props.titleProperty = 'label';
    render();
    expect(component.find('.item-name').text()).toContain('label as title');
  });

  it('should include a template label and custom buttons inside the footer', () => {
    render();
    expect(component.find(ItemFooter).find(TemplateLabel).props().template).toBe('templateId');
    expect(component.find(ItemFooter).find('div').at(0).text()).toContain('Buttons');
  });

  describe('Metadata', () => {
    it('should render FormatMetadata passing entity sort property and additionalMetadata', () => {
      props.search = { sort: 'sortedProperty' };
      props.additionalMetadata = ['additioal', 'metadata'];
      render();
      expect(component.find(FormatMetadata).props().entity).toEqual(props.doc.toJS());
      expect(component.find(FormatMetadata).props().sortedProperty).toBe(props.search.sort);
      expect(component.find(FormatMetadata).props().additionalMetadata).toBe(props.additionalMetadata);
    });
  });

  describe('when doc have no snippets', () => {
    it('should not render snippet secction when undefined', () => {
      props.doc = Immutable({
        type: 'entity',
        icon: { _id: 'icon', type: 'Icons' },
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
        icon: { _id: 'icon', type: 'Icons' },
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
        icon: { _id: 'icon', type: 'Icons' },
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: [{ text: '<span>snippet!</span>', page: 1 }]
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
      expect(mapStateToProps({ templates, thesauris }, {})).toEqual({ templates, thesauris, search });
    });

    it('should allow overriding the default sort', () => {
      const ownProps = { searchParams: { sort: 'newSort' } };
      expect(mapStateToProps({ templates, thesauris }, ownProps)).toEqual({ templates, thesauris, search: { sort: 'newSort' } });
    });
  });
});
