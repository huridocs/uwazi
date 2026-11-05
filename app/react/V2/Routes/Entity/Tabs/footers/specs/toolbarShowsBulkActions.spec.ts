import { SIDE_TAB } from '../../tabIds.js';
import { toolbarShowsBulkActions } from '../FilesTabFooter.js';

describe('toolbarShowsBulkActions', () => {
  it('hides bulk actions when the file pane lists the selection', () => {
    expect(toolbarShowsBulkActions(false, 2, SIDE_TAB.FILE)).toBe(false);
  });

  it('shows bulk actions on a phone, for one file, and on another side tab', () => {
    expect(toolbarShowsBulkActions(true, 2, SIDE_TAB.FILE)).toBe(true);
    expect(toolbarShowsBulkActions(false, 1, SIDE_TAB.FILE)).toBe(true);
    expect(toolbarShowsBulkActions(false, 2, SIDE_TAB.TRANSLATIONS)).toBe(true);
  });
});
