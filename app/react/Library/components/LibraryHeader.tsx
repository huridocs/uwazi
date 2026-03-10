/* eslint-disable react/no-multi-comp */
import { Translate } from 'app/I18N';
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';

import { Icon } from 'UI';
import { NeedAuthorization } from 'app/Auth';
import { SortDropdown } from 'app/Library/components/SortDropdown';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import { SearchBar as SearchBarComponent } from 'app/Library/components/SearchBar';
import {
  zoomIn as zoomInAction,
  zoomOut as zoomOutAction,
} from 'app/Library/actions/libraryActions';
import { showFilters as showFiltersAction } from 'app/Entities/actions/uiActions';
import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { HiddenColumnsDropdown } from './HiddenColumnsDropdown';

interface LibraryHeaderOwnProps {
  counter: React.ReactElement;
  selectAllDocuments: () => {};
  SearchBar?: typeof SearchBarComponent;
  searchCentered?: boolean;
  filters: IImmutable<{ documentTypes: string[] }>;
  tableViewMode: boolean;
  scrollCount: number;
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
    { zoomIn: zoomInAction, zoomOut: zoomOutAction, showFilters: showFiltersAction },
    wrapDispatch(dispatch, 'library')
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & LibraryHeaderOwnProps;

const FiltersButton = ({
  tableViewMode,
  showFilters,
}: {
  tableViewMode: boolean;
  showFilters: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => (
  <div className={`toggle-button ${!tableViewMode ? 'only-mobile' : 'unpinned'}`}>
    <button type="button" className="btn btn-default" onClick={showFilters}>
      <Icon icon="funnel-filter" />
      <span className="filters-label">
        <Translate>Show filters</Translate>
      </span>
      <span className="tab-link-tooltip">
        <Translate>Show filters</Translate>
      </span>
    </button>
  </div>
);

const LibraryHeaderComponent = ({
  filters,
  selectAllDocuments,
  counter,
  SearchBar,
  searchCentered,
  zoomIn,
  zoomOut,
  tableViewMode,
  scrollCount = 0,
  showFilters,
}: mappedProps) => {
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const toggleToolbarVisible = () => {
    setToolbarVisible(!toolbarVisible);
  };

  useEffect(() => {
    if (toolbarVisible && scrollCount > 0) {
      setToolbarVisible(false);
    }
  }, [scrollCount]);

  return (
    <>
      <div className={`library-header ${!toolbarVisible ? 'closed' : ''}`}>
        <div className="library-toolbar">
          {SearchBar !== undefined && SearchBar && (
            <div className={`search-list ${searchCentered ? 'centered' : ''}`}>
              <SearchBar />
            </div>
          )}
          <div className="header-bottom">
            <div className="sort-by">
              <span className="documents-counter-sort">
                <Translate>sorted by</Translate>
              </span>
              <SortDropdown selectedTemplates={filters.get('documentTypes')} />
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
            </div>
            <LibraryModeToggleButtons
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              tableViewMode={tableViewMode}
              zoomLevel={0}
              searchUrl=""
              showGeolocation={false}
            />
            <div className="documents-counter">
              <span className="documents-counter-label">{counter}</span>
            </div>
            {tableViewMode && <HiddenColumnsDropdown />}
            <FiltersButton tableViewMode={tableViewMode} showFilters={showFilters} />
          </div>
        </div>
        <div className="close-toolbar-button">
          <button type="button" className="toggle-toolbar-button" onClick={toggleToolbarVisible}>
            <Translate>Hide toolbar</Translate>
          </button>
        </div>
      </div>

      <div className={`open-toolbar-button ${toolbarVisible ? 'closed' : ''}`}>
        <button type="button" className="toggle-toolbar-button" onClick={toggleToolbarVisible}>
          <Translate>Show toolbar</Translate>
        </button>
      </div>
    </>
  );
};

const container = connector(LibraryHeaderComponent);
export type { LibraryHeaderOwnProps };
export { container as LibraryHeader };
