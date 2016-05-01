import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {UploadDoc} from 'app/Uploads/components/UploadDoc';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

describe('UploadDoc', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({title: 'doc title'})
    };
  });

  let render = () => {
    component = shallow(<UploadDoc {...props} />);
  };

  it('should render the title', () => {
    render();
    expect(component.find(ItemName).children().text()).toBe('doc title');
  });

  it('should render success status by default', () => {
    render();
    expect(component.find(RowList.Item).props().status).toBe('success');
    expect(component.find(ItemFooter.Label).props().status).toBe('success');
  });

  describe('when document uploaded is false', () => {
    it('should render danger status', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: false})
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('danger');
      expect(component.find(ItemFooter.Label).props().status).toBe('danger');
    });
  });

  describe('when document has uploading progress', () => {
    it('should render info status and the progressBar', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: false}),
        progress: 0 
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('info');
      expect(component.find(ItemFooter.ProgressBar).props().progress).toBe(0);
    });
  });
});
