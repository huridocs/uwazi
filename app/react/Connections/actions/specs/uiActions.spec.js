import * as uiActions from '../uiActions';

describe('Connections uiActions', () => {
  describe('openPanel', () => {
    it('should broadcast OPEN_CONNECTION_PANEL with values', () => {
      expect(uiActions.openPanel('type', 'sourceId')).toEqual({type: 'OPEN_CONNECTION_PANEL', sourceDocument: 'sourceId', connectionType: 'type'});
    });
  });

  describe('closePanel', () => {
    it('should broadcast CLOSE_CONNECTION_PANEL', () => {
      expect(uiActions.closePanel()).toEqual({type: 'CLOSE_CONNECTION_PANEL'});
    });
  });

  describe('searching', () => {
    it('should broadcast SEARCHING_CONNECTIONS', () => {
      expect(uiActions.searching()).toEqual({type: 'SEARCHING_CONNECTIONS'});
    });
  });
});
