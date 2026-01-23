/**
 * @jest-environment jsdom
 */

describe('openEntitySidePanel', () => {
  const sharedId = 'entityId';

  const setup = () => {
    const setMock = jest.fn(() => ({ type: 'SET' }));
    const thunkResult = 'thunkResult';
    const getAndSelectDocumentMock = jest.fn(() => jest.fn().mockReturnValue(thunkResult));
    const innerDispatch = jest.fn();
    const wrapDispatchFn = jest.fn(action => {
      if (typeof action === 'function') {
        return action(innerDispatch, jest.fn());
      }
      innerDispatch(action);
      return action;
    });
    const wrapDispatchMock = jest.fn(() => wrapDispatchFn);
    const storeDispatchMock = jest.fn();

    jest.resetModules();
    jest.doMock('#app/store', () => ({ store: { dispatch: storeDispatchMock } }), {
      virtual: true,
    });
    jest.doMock(
      '#app/BasicReducer',
      () => ({
        actions: { set: setMock },
      }),
      { virtual: true }
    );
    jest.doMock(
      '#app/Library/actions/libraryActions',
      () => ({
        getAndSelectDocument: getAndSelectDocumentMock,
      }),
      { virtual: true }
    );
    jest.doMock(
      '#app/Multireducer',
      () => ({
        wrapDispatch: wrapDispatchMock,
      }),
      { virtual: true }
    );

    // eslint-disable-next-line global-require
    const { openEntitySidePanel } = require('../openEntitySidePanel');

    return {
      openEntitySidePanel,
      setMock,
      getAndSelectDocumentMock,
      wrapDispatchMock,
      innerDispatch,
      storeDispatchMock,
    };
  };

  it('sets the side panel view to library and selects the entity', () => {
    const {
      openEntitySidePanel,
      setMock,
      getAndSelectDocumentMock,
      wrapDispatchMock,
      storeDispatchMock,
    } = setup();

    openEntitySidePanel(sharedId);

    expect(wrapDispatchMock).toHaveBeenCalledWith(storeDispatchMock, 'library');
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith('library.sidepanel.view', 'library');
    expect(getAndSelectDocumentMock).toHaveBeenCalledWith(sharedId);
  });

  it('sets the provided tab before selecting the entity', () => {
    const { openEntitySidePanel, setMock } = setup();
    const tab = 'relationships';

    openEntitySidePanel(sharedId, tab);

    expect(setMock).toHaveBeenNthCalledWith(1, 'library.sidepanel.view', 'library');
    expect(setMock).toHaveBeenNthCalledWith(2, 'library.sidepanel.tab', tab);
  });
});
