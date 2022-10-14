import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import React from 'react';

import { Icon } from 'UI';
import { searchDocuments, processFilters } from 'app/Library/actions/libraryActions';
import { t, Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import ModalTips from 'app/App/ModalTips';
import { SearchTipsContent } from 'app/App/SearchTipsContent';
import { submitNewSearch } from 'app/SemanticSearch/actions/actions';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import { IStore } from 'app/istore';

interface SearchBarOwnProps {
  storeKey: 'library' | 'uploads';
  counter: React.ReactElement;
}
const mapStateToProps = (state: IStore, props: SearchBarOwnProps) => {
  const search = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  return {
    search,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, props: SearchBarOwnProps) =>
  bindActionCreators(
    {
      searchDocuments,
      change: formActions.change,
      semanticSearch: submitNewSearch,
    },
    wrapDispatch(dispatch, props.storeKey)
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & SearchBarOwnProps;
// eslint-disable-next-line import/exports-last
const SearchBarComponent = ({
  search,
  storeKey,
  searchDocuments,
  change,
  semanticSearch,
}: mappedProps) => {
  const resetSearch = () => {
    change(`${storeKey}.search.searchTerm`, '');
    const newSearch = { ...search };
    newSearch.searchTerm = '';
    searchDocuments({ search: newSearch }, storeKey);
  };

  const submitSemanticSearch = () => {
    semanticSearch(search);
  };

  const submitSearch = () => {
    searchDocuments(search, storeKey);
  };

  const runSearch = (newSearch: any) => {
    searchDocuments({ search: newSearch }, storeKey);
  };

  const model = `${storeKey}.search`;

  return (
    <div className="search-box">
      <Form model={model} onSubmit={runSearch} autoComplete="off">
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
          <Icon icon="search" onClick={submitSearch} aria-label="Search button" />
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
