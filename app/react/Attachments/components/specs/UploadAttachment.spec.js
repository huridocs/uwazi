import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {UploadAttachment} from '../UploadAttachment';

describe('UploadAttachment', () => {
  let component;
  let props;
  let e;

  beforeEach(() => {
    e = {target: {files: [{id: 'f1'}]}};
    props = {
      uploadAttachment: jasmine.createSpy('uploadAttachment'),
      entityId: 'idE1',
      progress: Immutable({}),
      languages: Immutable(['en']),
      storeKey: 'library'
    };
  });

  let render = () => {
    component = shallow(<UploadAttachment {...props}/>);
  };

  it('should include label and input to upload attachment', () => {
    render();
    expect(component.find('input').length).toBe(1);
    expect(component.find('label').props().htmlFor).toBe('upload-attachment-input');
    expect(component.find('label > input').props().id).toBe('upload-attachment-input');

    expect(props.uploadAttachment).not.toHaveBeenCalled();
    component.find('label > input').props().onChange(e);
    expect(props.uploadAttachment).toHaveBeenCalledWith('idE1', {id: 'f1'}, 'library');
  });

  describe('when there are multiple languages', () => {
    it('should have another input to upload to all languages', () => {
      props.languages = Immutable(['es', 'en']);
      render();

      expect(component.find('input').length).toBe(2);

      expect(component.find('label').at(0).props().htmlFor).toBe('upload-attachment-input');
      expect(component.find('label > input').at(0).props().id).toBe('upload-attachment-input');
      expect(component.find('label').at(1).props().htmlFor).toBe('upload-attachment-all-input');
      expect(component.find('label > input').at(1).props().id).toBe('upload-attachment-all-input');

      expect(props.uploadAttachment).not.toHaveBeenCalled();
      component.find('label > input').at(0).props().onChange(e);
      expect(props.uploadAttachment).toHaveBeenCalledWith('idE1', {id: 'f1'}, 'library');

      props.uploadAttachment.calls.reset();

      expect(props.uploadAttachment).not.toHaveBeenCalled();
      component.find('label > input').at(1).props().onChange(e);
      expect(props.uploadAttachment).toHaveBeenCalledWith('idE1', {id: 'f1'}, 'library', {allLanguages: true});
    });
  });

  describe('when uploading', () => {
    it('should show a progress bar only', () => {
      props.languages = Immutable(['es', 'en']);
      props.progress = Immutable({idE1: 77});

      render();

      expect(component.find('input').length).toBe(0);

      expect(component.find('span').at(1).text()).toMatch('77%');
    });
  });
});
