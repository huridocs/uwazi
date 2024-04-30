import React, { useState, useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { connect, ConnectedProps } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Icon } from 'UI';
import {
  searchDocuments as searchDocumentsAction,
  processFilters,
} from 'app/Library/actions/libraryActions';
import { t, Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import ModalTips from 'app/App/ModalTips';
import { SearchTipsContent } from 'app/App/SearchTipsContent';
import { submitNewSearch } from 'app/SemanticSearch/actions/actions';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import { IStore } from 'app/istore';
import { Form } from 'app/Forms/Form';

interface SearchBarOwnProps {}
const mapStateToProps = (state: IStore) => {
  const { search, filters } = state.library;
  return {
    initSearch: search,
    initFilters: filters,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      searchDocuments: searchDocumentsAction,
      change: formActions.change,
      semanticSearch: submitNewSearch,
    },
    wrapDispatch(dispatch, 'library')
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & SearchBarOwnProps;

const SearchBarComponent = ({
  initSearch,
  initFilters,

  searchDocuments,
  change,
  semanticSearch,
}: mappedProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const search = processFilters(initSearch, initFilters.toJS());
  const [searchTerm, setSearchTerm] = useState(search.searchTerm);
  const resetSearch = () => {
    change('library.search.searchTerm', '');
    const newSearch = { ...search };
    newSearch.searchTerm = '';
    searchDocuments({ search: newSearch, location, navigate });
    setSearchTerm('');
  };

  let debouncedSearch: string | number | NodeJS.Timeout | undefined;
  useEffect(() => {
    if (debouncedSearch) clearTimeout(debouncedSearch);
    debouncedSearch = setTimeout(() => {
      change('library.search.searchTerm', searchTerm);
    }, 350);
    return () => clearTimeout(debouncedSearch);
  }, [searchTerm, change]);

  const submitSemanticSearch = () => {
    semanticSearch(search);
  };

  const doSearch = (newSearch: any) => {
    change('library.search.searchTerm', searchTerm);
    searchDocuments({ search: { ...newSearch, searchTerm }, location, navigate });
  };

  return (
    <div className="search-box">
      <Form model="library.search" onSubmit={doSearch}>
        <div className={`input-group${search.searchTerm ? ' is-active' : ''}`}>
          <input
            type="text"
            placeholder={t('System', 'Search', null, false)}
            aria-label={t('System', 'Search text description', null, false)}
            className="form-control"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Icon icon="times" onClick={resetSearch} aria-label="Reset Search input" />

          <button type="submit" className="search-icon-wrapper">
            <Icon icon="search" aria-label="Search button" />
          </button>
        </div>
        <FeatureToggleSemanticSearch>
          <button
            disabled={!search.searchTerm}
            type="button"
            onClick={submitSemanticSearch}
            className="btn btn-success semantic-search-button"
          >
            <Icon icon="flask" /> <Translate>Semantic Search</Translate>
          </button>
        </FeatureToggleSemanticSearch>
      </Form>
      <ModalTips
        label={t('System', 'Search Tips', null, false)}
        title={t('System', 'Narrow down your searches', null, false)}
      >
        <SearchTipsContent />
      </ModalTips>
    </div>
  );
};

const container = connector(SearchBarComponent);
export { container as SearchBar };
