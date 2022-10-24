import { Translate } from 'app/I18N';
import React, { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';

import { NeedAuthorization } from 'app/Auth';
import { SortButtons } from 'app/Library/components/SortButtons';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import {
  zoomIn as zoomInAction,
  zoomOut as zoomOutAction,
} from 'app/Library/actions/libraryActions';
import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';

interface LibraryHeaderOwnProps {
  storeKey: 'library' | 'uploads';
  counter: React.ReactElement;
  selectAllDocuments: () => {};
  sortButtonsStateProperty: string;
  SearchBar?: Function;
  searchCentered?: boolean;
  searchDocuments: Function;
  filters: IImmutable<{ documentTypes: string[] }>;
  tableViewMode: boolean;
}

const mapStateToProps = (state: IStore) => ({
  filtersPanel: state.library.ui.get('filtersPanel'),
  search: state.library.search,
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  multipleSelected: state.library.ui.get('selectedDocuments').size > 1,
  rowListZoomLevel: state.library.ui.get('zoomLevel'),
});

const mapDispatchToProps = (dispatch: Dispatch<IStore>) =>
  bindActionCreators(
    { zoomIn: zoomInAction, zoomOut: zoomOutAction },
    wrapDispatch(dispatch, 'library')
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & LibraryHeaderOwnProps;

const LibraryHeaderComponent = ({
  storeKey,
  filters,
  sortButtonsStateProperty,
  selectAllDocuments,
  counter,
  searchDocuments,
  SearchBar,
  searchCentered,
  zoomIn,
  zoomOut,
  tableViewMode,
}: mappedProps) => {
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const toggleToolbarVisible = () => {
    setToolbarVisible(!toolbarVisible);
  };

  return (
    <>
      <div className={`library-header ${!toolbarVisible ? 'closed' : ''}`}>
        <div className="library-toolbar">
          {SearchBar !== undefined && (
            <div className={`search-list ${searchCentered ? 'centered' : ''}`}>
              <SearchBar storeKey={storeKey} />
            </div>
          )}

          <div className="sort-by">
            <span className="documents-counter-sort">
              <Translate>sorted by</Translate>
            </span>
            <SortButtons
              sortCallback={searchDocuments}
              selectedTemplates={filters.get('documentTypes')}
              stateProperty={sortButtonsStateProperty}
              storeKey={storeKey}
            />
            <NeedAuthorization>
              <div className="select-all-documents">
                <button
                  type="button"
                  className="btn btn-default btn-xs"
                  onClick={selectAllDocuments}
                >
                  <Translate>Select all</Translate>
                </button>
              </div>
            </NeedAuthorization>
            <div className="documents-counter">
              <span className="documents-counter-label">{counter}</span>
            </div>
          </div>
          <LibraryModeToggleButtons
            storeKey="library"
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            tableViewMode={tableViewMode}
            zoomLevel={0}
            searchUrl=""
            showGeolocation={false}
          />
        </div>
        <div className="close-toolbar-button">
          <button type="button" className="toggle-toolbar-button" onClick={toggleToolbarVisible}>
            <Translate>Close toolbar</Translate>
          </button>
        </div>
      </div>

      <div className={`open-toolbar-button ${toolbarVisible ? 'closed' : ''}`}>
        <button type="button" className="toggle-toolbar-button" onClick={toggleToolbarVisible}>
          <Translate>Open toolbar</Translate>
        </button>
      </div>
    </>
  );
};

const container = connector(LibraryHeaderComponent);
export type { LibraryHeaderOwnProps };
export { container as LibraryHeader };
