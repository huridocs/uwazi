import { renderConnected } from 'app/utils/test/renderConnected';
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import { LibraryFooter } from '../LibraryFooter';

describe('LibraryFooter', () => {
  it.each(['library', 'uploads'])(
    'should dispatch an action to open the entity creation panel',
    storeKey => {
      spyOn(uploadActions, 'newEntity').and.returnValue(async () => Promise.resolve());
      const props = { storeKey };
      const component = renderConnected(LibraryFooter, props, {});

      const createButton = component.find({ icon: 'plus' }).parent();
      createButton.simulate('click');
      expect(uploadActions.newEntity).toHaveBeenCalledWith(storeKey);
    }
  );

  it('should dispatch an action to open the import panel', () => {
    spyOn(uploadActions, 'showImportPanel').and.returnValue(async () => Promise.resolve());
    const props = { storeKey: 'library' };
    const component = renderConnected(LibraryFooter, props, {});

    const createButton = component.find({ icon: 'import-csv' }).parent();
    createButton.simulate('click');
    expect(uploadActions.showImportPanel).toHaveBeenCalled();
  });
});
