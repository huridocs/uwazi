import React from 'react';
import {shallow} from 'enzyme';
import {TabLink, TabContent} from 'react-tabs-redux';

import MarkDown from '../MarkDown';
import MarkDownViewer from 'app/Markdown';

describe('MarkDown', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: '<b>This is a title</b>',
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<MarkDown {...props}/>);
  };

  it('should have an edit tab with a textarea', () => {
    render();

    let tablinks = component.find(TabLink);
    expect(tablinks.first().props().to).toBe('edit');

    let tabs = component.find(TabContent);
    expect(tabs.first().props().for).toBe('edit');

    let textarea = tabs.first().find('textarea');
    expect(textarea.length).toBe(1);
  });

  it('should put the value in the textarea and default to 6 rows', () => {
    render();
    let textarea = component.find(TabContent).first().find('textarea');
    expect(textarea.props().value).toBe('<b>This is a title</b>');
    expect(textarea.props().rows).toBe(6);
  });

  it('should allow to customize de number of rows', () => {
    props.rows = 12;
    render();
    let textarea = component.find(TabContent).first().find('textarea');
    expect(textarea.props().rows).toBe(12);
  });

  describe('preview tab', () => {
    it('shows markdown as html', () => {
      props.value = '# <b>This is a title</b>';
      render();
      let container = component.find(MarkDownViewer);
      expect(container.props().markdown).toBe('# <b>This is a title</b>');
    });
  });
});
