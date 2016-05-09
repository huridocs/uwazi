import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import {enterLibrary, setDocuments, setTemplates} from 'app/Library/actions/libraryActions';
import {libraryFilters, generateDocumentTypes} from 'app/Library/helpers/libraryFilters';
import documentsAPI from 'app/Library/DocumentsAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import SearchBar from 'app/Library/components/SearchBar';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';
import {store} from 'app/store';
import {getValues} from 'redux-form';

export default class Library extends RouteHandler {

  static renderTools() {
    return <SearchBar/>;
  }

  static requestState() {
    let searchTerm = '';
    let filters = {};
    //
    if (store) {
      let state = store.getState();
      searchTerm = state.searchTerm;
      filters = Object.assign({}, getValues(state.filtersForm), state.search);
    }
    //
    return Promise.all([documentsAPI.search(searchTerm, filters), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      let documentTypes = generateDocumentTypes(templates);
      let properties = libraryFilters(templates, documentTypes);

      return {
        library: {
          documents: documents,
          filters: {templates: templates, documentTypes, properties, thesauris, allDocumentTypes: false}
        }
      };
    });
  }

  setReduxState({library}) {
    this.context.store.dispatch(setDocuments(library.documents));
    this.context.store.dispatch(setTemplates(library.filters.templates, library.filters.thesauris));
  }

  componentDidMount() {
    this.context.store.dispatch(enterLibrary());
  }

  render() {
    return <div className="row panels-layout">
              <DocumentsList />
              <LibraryFilters />
              <ContextMenu />
            </div>;
  }
}

//when all components are integrated with redux we can remove this
Library.__redux = true;
