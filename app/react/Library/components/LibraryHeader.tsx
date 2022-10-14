import { Translate } from 'app/I18N';
import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';

import { connect, ConnectedProps } from 'react-redux';

import { NeedAuthorization } from 'app/Auth';
import { SearchBar } from 'app/Library/components/SearchBar';
import { SortButtons } from 'app/Library/components/SortButtons';
import { IStore } from 'app/istore';
import { wrapDispatch } from 'app/Multireducer';
import { searchDocuments as searchDocumentsAction } from 'app/Library/actions/libraryActions';

interface LibraryHeaderOwnProps {
  storeKey: 'library' | 'uploads';
  counter: React.ReactElement;
  selectAllDocuments: () => {};
  sortButtonsStateProperty: string;
}

const mapStateToProps = (state: IStore) => ({
  documents: state.library.documents,
  filters: state.library.filters,
  filtersPanel: state.library.ui.get('filtersPanel'),
  search: state.library.search,
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  multipleSelected: state.library.ui.get('selectedDocuments').size > 1,
  rowListZoomLevel: state.library.ui.get('zoomLevel'),
});

const mapDispatchToProps = (dispatch: Dispatch<{}>, props: LibraryHeaderOwnProps) =>
  bindActionCreators(
    {
      searchDocuments: searchDocumentsAction,
    },
    wrapDispatch(dispatch, props.storeKey)
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
}: mappedProps) => {
  const [footerVisible, setFooterVisible] = useState(true);
  const toggleFooterVisible = () => {
    setFooterVisible(!footerVisible);
  };

  return (
    <>
      <div className="library-header">
        <div className="search-list ">
          {' '}
          <SearchBar storeKey={storeKey} counter={counter} />{' '}
        </div>
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
              <button type="button" className="btn btn-default btn-xs" onClick={selectAllDocuments}>
                <Translate>Select all</Translate>
              </button>
            </div>
          </NeedAuthorization>
          <div className="documents-counter">
            <span className="documents-counter-label">{counter}</span>
          </div>
        </div>
      </div>
      <div className={`open-actions-button ${footerVisible ? 'closed' : ''}`}>
        <button type="button" className="toggle-footer-button" onClick={toggleFooterVisible}>
          <Translate>Open actions</Translate>
        </button>
      </div>
    </>
  );
};

const container = connector(LibraryHeaderComponent);
export { container as LibraryHeader };
