import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from './components/DocumentsList';
import LibraryFilters from './components/LibraryFilters';
import {getDocumentsByFilter, enterLibrary, setDocuments, setTemplates} from './actions/libraryActions';
import {libraryFilters, generateDocumentTypes} from './helpers/libraryFilters';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import SearchBar from './components/SearchBar';
import ContextMenu from 'app/ContextMenu';
import LibraryMenu from './components/LibraryMenu';
import ViewMetadataPanel from './components/ViewMetadataPanel';
import ConfirmCloseForm from './components/ConfirmCloseForm';
import {store} from 'app/store';

export default class Library extends RouteHandler {

  static renderTools() {
    return <SearchBar/>;
  }

  static requestState() {
    return Promise.all([getDocumentsByFilter(store.getState().search, null, store.getState), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      let docs = documents;
      let documentTypes = generateDocumentTypes(templates);
      let properties = libraryFilters(templates, documentTypes);

      return {
        library: {
          documents: docs,
          filters: {templates, documentTypes, properties, thesauris, allDocumentTypes: false}
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
              <ConfirmCloseForm />
              <LibraryFilters />
              <ViewMetadataPanel />
              <ContextMenu>
                <LibraryMenu/>
              </ContextMenu>
            </div>;
  }
}
