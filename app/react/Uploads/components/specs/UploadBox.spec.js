import React from 'react';

import { UploadBox } from 'app/Uploads/components/UploadBox';
import { shallow } from 'enzyme';

describe('UploadBox', () => {
  let files = [{ name: 'fighting__crime--101.pdf' }, { name: 'file2' }];

  if (typeof File === 'function') {
    files = [new File([], 'fighting__crime--101.pdf'), new File([], 'fighting__crime--101.pdf')];
  }

  let component;
  let instance;

  const documentCreation = new Promise(resolve => {
    resolve({ sharedId: 'abc1' });
  });

  const props = {
    createDocument: jasmine.createSpy('createDocument').and.returnValue(documentCreation),
    uploadDocument: jasmine.createSpy('uploadDocument'),
    documentProcessed: jasmine.createSpy('documentProcessed'),
    documentProcessError: jasmine.createSpy('documentProcessError'),
    unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
  };

  const render = () => {
    component = shallow(<UploadBox {...props} />);
    instance = component.instance();
  };

  describe('onDrop', () => {
    it('should upload all documents passed', done => {
      render();
      instance.onDrop(files);
      expect(props.createDocument).toHaveBeenCalledWith({ title: 'Fighting crime 101' });
      documentCreation
        .then(() => {
          expect(props.uploadDocument).toHaveBeenCalledWith('abc1', files[0]);
          expect(props.uploadDocument).toHaveBeenCalledWith('abc1', files[1]);
          done();
        })
        .catch(done.fail);
    });

    it('should should call unselectAllDocuments to close the document form being edited', () => {
      render();
      instance.onDrop([]);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
    });
  });
});
