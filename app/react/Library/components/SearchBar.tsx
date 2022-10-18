import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import React from 'react';

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

interface SearchBarOwnProps {
  storeKey: 'library' | 'uploads';
}
const mapStateToProps = (state: IStore, props: SearchBarOwnProps) => {
  const { search, filters } = state[props.storeKey];
  return {
    initSearch: search,
    initFilters: filters,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, props: SearchBarOwnProps) =>
  bindActionCreators(
    {
      searchDocuments: searchDocumentsAction,
      change: formActions.change,
      semanticSearch: submitNewSearch,
    },
    wrapDispatch(dispatch, props.storeKey)
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & SearchBarOwnProps;
// eslint-disable-next-line import/exports-last
const SearchBarComponent = ({
  initSearch,
  initFilters,
  storeKey,
  searchDocuments,
  change,
  semanticSearch,
}: mappedProps) => {
  const search = processFilters(initSearch, initFilters.toJS());
  const resetSearch = () => {
    change(`${storeKey}.search.searchTerm`, '');
    const newSearch = { ...search };
    newSearch.searchTerm = '';
    searchDocuments({ search: newSearch }, storeKey);
  };

  const submitSemanticSearch = () => {
    semanticSearch(search);
  };

  const doSearch = (newSearch: any) => {
    searchDocuments({ search: newSearch }, storeKey);
  };

  const model = `${storeKey}.search`;
  return (
    <div className="search-box">
      <Form model={model} onSubmit={doSearch}>
        <div className={`input-group${search.searchTerm ? ' is-active' : ''}`}>
          <Field model=".searchTerm">
            <input
              type="text"
              placeholder={t('System', 'Search', null, false)}
              aria-label={t('System', 'Search text description', null, false)}
              className="form-control"
              autoComplete="off"
            />
            <Icon icon="times" onClick={resetSearch} aria-label="Reset Search input" />
          </Field>
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
