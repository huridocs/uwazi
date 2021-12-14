import { TabLink, TabContent } from 'react-tabs-redux';
import React from 'react';

import { shallow, ShallowWrapper } from 'enzyme';
import MarkDownViewer from 'app/Markdown';

import { MarkDown, MarkDownType } from '../MarkDown';

describe('MarkDown', () => {
  let component: ShallowWrapper<MarkDown>;
  let props: MarkDownType;

  beforeEach(() => {
    props = {
      value: '<b>This is a title</b>',
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<MarkDown {...props} />);
  };

  it('should have an edit tab with a textarea', () => {
    render();

    const tablinks = component.find(TabLink);
    expect(tablinks.first().props().to).toBe('edit');

    const tabs = component.find(TabContent);
    expect(tabs.first().props().for).toBe('edit');

    const textarea = tabs.first().find('textarea');
    expect(textarea.length).toBe(1);
  });

  it('should put the value in the textarea and default to 6 rows', () => {
    render();
    const textarea = component.find(TabContent).first().find('textarea');
    expect(textarea.props().value).toBe('<b>This is a title</b>');
    expect(textarea.props().rows).toBe(6);
  });

  it('should allow to customize de number of rows', () => {
    props.rows = 12;
    render();
    const textarea = component.find(TabContent).first().find('textarea');
    expect(textarea.props().rows).toBe(12);
  });

  describe('preview tab', () => {
    it('shows markdown as html', () => {
      props.value = '# <b>This is a title</b>';
      render();
      const container = component.find(MarkDownViewer);
      expect(container.props().markdown).toBe('# <b>This is a title</b>');
    });
    it('should not display if the pages is for an entity view', () => {
      props.showPreview = false;
      render();
      const tabLink = component.findWhere(
        n => n.name() === 'TabLink' && n.prop('to') === 'preview'
      );
      const tabContent = component.findWhere(
        n => n.name() === 'TabContent' && n.prop('for') === 'preview'
      );
      expect(tabLink.exists()).toBe(false);
      expect(tabContent.exists()).toBe(false);
    });
  });
});
