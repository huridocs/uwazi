import React from 'react';
import {shallow} from 'enzyme';

import {UploadBox} from 'app/Uploads/components/UploadBox';

describe('UploadBox', () => {
  let files = [{name: 'fighting__crime--101.pdf'}, {name: 'file2'}];

  if (typeof File === 'function') {
    files = [new File([], 'fighting__crime--101.pdf'), new File([], 'fighting__crime--101.pdf')];
  }

  let component;
  let instance;

  let props = {
    uploadDocument: jasmine.createSpy('uploadDocument'),
    finishEdit: jasmine.createSpy('finishEdit')
  };

  let render = () => {
    component = shallow(<UploadBox {...props}/>);
    instance = component.instance();
  };

  describe('onDrop', () => {
    it('should upload all documents passed', () => {
      render();
      instance.onDrop(files);
      expect(props.uploadDocument).toHaveBeenCalledWith({title: 'Fighting crime 101'}, files[0]);
      expect(props.uploadDocument).toHaveBeenCalledWith({title: 'File2'}, files[1]);
    });

    it('should should call finishEdit to close the document form being edited', () => {
      render();
      instance.onDrop([]);
      expect(props.finishEdit).toHaveBeenCalled();
    });
  });
});
