import { renderConnected } from 'app/utils/test/renderConnected';
import { ShallowWrapper } from 'enzyme';
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import * as libraryActions from 'app/Library/actions/libraryActions';
import { PDFUploadButton } from '../PDFUploadButton';

describe('PDFUploadButton', () => {
  let files = [{ name: 'fighting__crime--101.pdf' }, { name: 'file2' }];

  if (typeof File === 'function') {
    files = [new File([], 'fighting__crime--101.pdf'), new File([], 'fighting__crime--101.pdf')];
  }

  let component: ShallowWrapper;

  const render = () => {
    component = renderConnected(PDFUploadButton, { storeKey: 'library' }, {});
  };

  it('should upload all documents passed and unselect everything to close the sidebar', done => {
    spyOn(uploadActions, 'createDocument').and.returnValue(async () =>
      Promise.resolve({ sharedId: 'abc1' })
    );
    spyOn(uploadActions, 'uploadDocument').and.returnValue(async () => Promise.resolve());
    spyOn(libraryActions, 'unselectAllDocuments').and.returnValue(async () => Promise.resolve());
    render();
    component.find('input').simulate('change', { target: { files } });

    expect(uploadActions.createDocument).toHaveBeenCalledWith({ title: 'Fighting crime 101' });
    setTimeout(() => {
      expect(uploadActions.uploadDocument).toHaveBeenCalledWith('abc1', files[0]);
      expect(uploadActions.uploadDocument).toHaveBeenCalledWith('abc1', files[1]);
      expect(libraryActions.unselectAllDocuments).toHaveBeenCalled();
      done();
    }, 0);
  });
});
