import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from './components/DocumentsList';
import LibraryFilters from './components/LibraryFilters';
import {getDocumentsByFilter, enterLibrary, setDocuments} from './actions/libraryActions';
import {libraryFilters} from './helpers/libraryFilters';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import SearchBar from './components/SearchBar';
import SearchButton from './components/SearchButton';
import ViewMetadataPanel from './components/ViewMetadataPanel';
import ConfirmCloseForm from './components/ConfirmCloseForm';
import {store} from 'app/store';
import {actions} from 'app/BasicReducer';

export default class Library extends RouteHandler {

  static renderTools() {
    return <div>
        <SearchBar/>
        <SearchButton/>
      </div>;
  }

  static requestState() {
    return Promise.all([getDocumentsByFilter(store.getState().search, null, store.getState), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      let properties = libraryFilters(templates, []);
      return {
        library: {
          documents,
          filters: {documentTypes: [], properties},
          aggregations: documents.aggregations
        },
        templates,
        thesauris
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(setDocuments(state.library.documents));
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
    this.context.store.dispatch(actions.set('library/aggregations', state.library.aggregations));
  }

  componentDidMount() {
    this.context.store.dispatch(enterLibrary());
  }

  render() {
    return <div className="row panels-layout">
      <DocumentsList />
      <ConfirmCloseForm />
      <LibraryFilters />
      <ViewMetadataPanel />
    </div>;
  }
}
