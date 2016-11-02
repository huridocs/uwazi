import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {AttachmentsList} from '../AttachmentsList';

describe('AttachmentsList', () => {
  let component;
  let props;
  let files;

  beforeEach(() => {
    files = Immutable([
      {originalname: 'Human name 1', filename: 'filename1.ext'},
      {originalname: 'Human name 2', filename: 'filename2.ext'}
    ]);

    props = {
      files
    };
  });

  let render = () => {
    component = shallow(<AttachmentsList {...props} />);
  };

  it('should render a list of attachments (files)', () => {
    render();
    expect(component.find('.item').length).toBe(2);
  });
});
