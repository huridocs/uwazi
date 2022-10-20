import { Translate } from 'app/I18N';
import React, { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { NeedAuthorization } from 'app/Auth';
import { SortButtons } from 'app/Library/components/SortButtons';
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
}

const mapStateToProps = (state: IStore) => ({
  filtersPanel: state.library.ui.get('filtersPanel'),
  search: state.library.search,
  selectedDocuments: state.library.ui.get('selectedDocuments'),
  multipleSelected: state.library.ui.get('selectedDocuments').size > 1,
  rowListZoomLevel: state.library.ui.get('zoomLevel'),
});

const connector = connect(mapStateToProps);

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
}: mappedProps) => {
  const [footerVisible, setFooterVisible] = useState(true);
  const toggleFooterVisible = () => {
    setFooterVisible(!footerVisible);
  };

  return (
    <>
      <div className="library-header">
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
export type { LibraryHeaderOwnProps };
export { container as LibraryHeader };
