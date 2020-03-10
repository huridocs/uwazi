/*eslint-disable max-lines */
/*eslint max-len: ["error", 500], */
/*eslint key-spacing: "error" */
export default {
  homeLink: 'header .logotype a',
  settingsView: {
    liElementsOfSection: '#app > div.content > div > div > div.settings-content > div > ul > li',
    tableElementsOfSection:
      '#app > div.content > div > div > div.settings-content > div > div.thesauri-list > table > tbody > tr',
    firstEditButton:
      '#app > div.content > div > div > div.settings-content > div > ul > li:nth-child(1) > div > a > i',
    collectionNameForm:
      '#app > div.content > div > div > div.settings-content > div > div.panel-body > form > div:nth-child(1) > input',
    settingsHeader:
      '#app > div.content > header > ul > li.menuActions > ul.menuNav-list > li:nth-child(3) > a',
    logoutButton:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
    accountButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(1)',
    collectionButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(3)',
    dictionariesButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(2)',
    dictionariesViewSuggestionsButton:
      '#app > div.content > div > div > div.settings-content > div > div.thesauri-list > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > a',
    dictionariesReviewSuggestionsButton:
      '#app > div.content > div > div > div.settings-content > div > div.cockpit > table > tbody > tr:nth-child(2) > td:nth-child(3) > a',
    entitiesButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
    connectionsButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(3)',
    filtersButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(8)',
    createFilterGroupButton:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > button.btn.btn-sm.btn-primary',
    newFilterGroupForm:
      '#app > div.content > div > div > div.settings-content > div > div.FiltersForm-list > div > div.panel-body > div > div.col-sm-9 > div > ul > div.list-group-item > div > div.input-group > input',
    listOfFilterGroups:
      '#app > div.content > div > div > div.settings-content > div > div.FiltersForm-list > div > div.panel-body > div > div.col-sm-9 > div > ul > div.list-group-item > div > div.input-group',
    filtrableTypesSaveButton:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > button.btn.btn-sm.btn-success',
    dictionariesBackButton:
      '#app > div.content > div > div > div.settings-content > div > form > div > div.settings-footer > a.btn.btn-default',
    documentsBackButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > a',
    connectionsBackButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > a',
    entitiesBackButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > a',
    addNewDictionary:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
    addNewDocument:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
    addNewEntity:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
    addNewConnection:
      '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
    addNewValueToDictionaryButton:
      '#app > div.content > div > div > div.settings-content > div > form > div > div.settings-footer > a.btn.btn-primary',
    firstDictionaryValForm:
      '#app > div.content > div > div > div.settings-content > div > form > div > div.thesauri-values > div:nth-child(2) > ul > div.list-group-item > div > div > input',
    secondDictionaryValForm:
      '#app > div.content > div > div > div.settings-content > div > form > div > div.thesauri-values > div:nth-child(2) > ul > div:nth-child(2) > div > div > input',
    saveDictionaryButton:
      '#app > div.content > div > div > div.settings-content > div > form > div > div.settings-footer > .save-template',
    saveDocumentButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > button',
    saveEntityButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > button',
    saveConnectionButton:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > button',
    saveCollectionButton:
      '#app > div.content > div > div > div.settings-content > div > div.panel-body > div.settings-footer > button',
    dictionaryNameForm: '#thesauriName',
    connectionNameForm:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
    entityNameForm:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
    entityBodyForm:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul',
    documentTemplateNameForm:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
    deleteButtonConfirmation:
      'body > div.ReactModalPortal > div > div > div > div.modal-footer > button.btn.confirm-button.btn-danger',
    translationsButton:
      '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(7)',
    translationInputEn:
      '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > ul > li:nth-child(3) > div:nth-child(2) > div > div > input',
    translationInputEs:
      '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > ul > li:nth-child(3) > div:nth-child(3) > div > div > input',
    translationsSaveButton:
      '#app > div.content > div > div > div.settings-content > div > form > div.settings-footer > button',
    privateInstance:
      '#app > div.content > div > div > div.settings-content > div > div.panel-body > form > div:nth-child(2) > div > label',
  },
  libraryView: {
    libraryFirstDocument:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(1)',
    libraryFirstDocumentLink:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(1) > div.item-actions > div:nth-child(2) > a',
    libraryFirstDocumentSnippet:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(1) > div.item-info > div.item-snippet-wrapper > div.item-snippet',
    librarySidePanelSnippet:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > ul.snippet-list > li.snippet-list-item',
    librarySidePanelFirstSnippet:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > ul.snippet-list > li:nth-child(1)',
    librarySidePanelSecondSnippet:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > ul.snippet-list > li:nth-child(2)',
    libraryFirstDocumentTitle:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(1) > div.item-info > div',
    librarySecondDocument:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(2)',
    librarySecondDocumentTitle:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(2) > div.item-info > div > span',
    librarySecondDocumentLink:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(2) > div.item-actions > div:nth-child(2) > a',
    anyItemSnippet: 'div.item-snippet-wrapper > div',
    libraryThirdDocument:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(3)',
    libraryMultiEditListHeader:
      '#app > div.content > div > div > aside.side-panel.multi-edit > div.sidepanel-header',
    libraryMultiEditEditButton:
      '#app > div.content > div > div > aside.side-panel.multi-edit.is-active > div.sidepanel-footer > button.edit.btn.btn-primary',
    libraryMultiEditDeleteButton:
      '#app > div.content > div > div > aside.side-panel.multi-edit.is-active > div.sidepanel-footer > button.delete.btn.btn-danger',
    libraryMultiEditSaveButton:
      '#app > div.content > div > div > aside.side-panel.multi-edit.is-active > div.sidepanel-footer > button.btn.btn-success',
    libraryMultiEditFormOption:
      '#multiEdit > div:nth-child(2) > div > ul > li.wide > ul > li:nth-child(2) > label > span',
    libraryMultiEditFirstInput:
      '#multiEdit > div:nth-child(2) > div:nth-child(1) > ul > li.wide > div > input',
    libraryMetadataPanel: '.side-panel.metadata-sidepanel',
    searchInLibrary: '#app > div.content > header > div > a',
    searchForm:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-body > div.search-box > form',
    searchInput:
      '#app > div.content > div > div > main > div > div > div.search-list > div > form > div.input-group > div > input',
    firstSearchSuggestion:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-body > div.search-box > form > div.search-suggestions > p:nth-child(1) > a',
    firstDocumentViewButton:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(2) > div.item-actions > div:nth-child(2) > a',
    firstEntityViewButton:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(1) > div.item-actions > div:nth-child(2) > a',
    documentTypeFilter:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-body > div.documentTypes-selector > ul > li:nth-child(4) > label > span.multiselectItem-name',
    editEntityButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.edit-metadata.btn.btn-primary',
    saveButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.btn.btn-success',
    deleteButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.delete-metadata.btn.btn-danger',
    deleteButtonConfirmation:
      'body > div.ReactModalPortal > div > div > div > div.modal-footer > button.btn.confirm-button.btn-danger',
    loadMore:
      '#app > div.content > div > div > main > div.documents-list > div > div.row > div:nth-child(2) > a:nth-child(1)',
    documentAfterLoadMore:
      '#app > div.content > div > div > main > div > div > div.item-group > div:nth-child(31)',
    superVillianType:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-body > div.documentTypes-selector.nested-selector > ul > li:nth-child(2) > label',
    minorVillianType:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-body > div.documentTypes-selector.nested-selector > ul > li:nth-child(5) > label',
    resetFilters:
      '#app > div.content > div > div > aside.side-panel.library-filters > div.sidepanel-footer > span',
    sidePanelCloseButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-header > button',
    sidePanelDocumentType:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > div > span',
  },
  documentView: {
    searchTextTab:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-header > div > ul > li:nth-child(1) > div',
    searchTextInput:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > form > div > div > div > input',
    searchTextForm:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > form',
    viewerFirstDocumentSnippet:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > ul > li:nth-child(1)',
    viewerSidePanelFirstSnippet:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > ul > li:nth-child(2)',
    viewer: '#app > div.content > div > div > main',
    sidePanelTitle:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > div > div > h1',
    documentPage: '.page',
    documentPageFirstParagraph: '#page-1 > div > div.textLayer > span:nth-child(1)',
    createParagraphLinkButton:
      '#app > div.content > div > div > div.ContextMenu.ContextMenu-center > div > div:nth-child(1)',
    createReferenceSidePanelIsActive:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active',
    createReferenceSidePanelSelect:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-header > select',
    createReferenceSidePanelSelectFirstType:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-header > ul > li:nth-child(1)',
    createReferenceSidePanelInput:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > .search-box input',
    createReferenceSidePanelFirstSearchSuggestion:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body .item-group > .item',
    createReferenceSidePanelNextButton:
      '#app > div.content > div > div > aside.side-panel.undefined.create-reference.is-active > div.sidepanel-footer > button.edit-metadata.btn.btn-success',
    targetDocument: '.document-viewer.show-target-document',
    saveConnectionButton:
      '#app > div.content > div > div > main > div > div > div > div:nth-child(1) > div.ContextMenu.ContextMenu-center > button',
    activeConnection:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div',
    editButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.edit-metadata.btn.btn-primary',
    saveButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.btn.btn-success',
    deleteButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.delete-metadata.btn.btn-danger',
    openSidePanelButton:
      '#app > div.content > div > div > div.ContextMenu.ContextMenu-bottom > div > div',
    metadataForm: '#metadataForm',
    unlinkIcon:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > div.item-actions > div.item-shortcut-group > a.item-shortcut.btn.btn-default.btn-hover-danger',
    sidePanelInfoTab:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-header > div > ul > li:nth-child(5) > div',
    sidePanelFirstDocumentTitle:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.filelist > ul > li > div > div.file-originalname',
    sidePanelFirstDocumentEditButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.filelist > ul > li > div > div:nth-child(2) > button',
    fileFormInput: '#originalname',
    fileFormSubmit:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.filelist > ul > li > form > div > div:nth-child(4) > button',
    fileFormCancel:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.filelist > ul > li > form > div > div:nth-child(5) > button',
    sidePanelFirstAttachmentTitle:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div:nth-child(2) > div:nth-child(1) > div > div > a > span > span',
    sidePanelFirstAttachmentEditTitleButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div:nth-child(2) > div:nth-child(1) > div > div > div > div > button:nth-child(1)',
    attachmentFormInput: '#attachmentForm > div > div > input',
    attachmentFormSubmit:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div:nth-child(2) > div:nth-child(1) > div > div > div.attachment-buttons > div > button.item-shortcut.btn.btn-success',
    attachmentFormCancel:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div:nth-child(2) > div:nth-child(1) > div > div > div.attachment-buttons > div > button.item-shortcut.btn.btn-primary',
    tocPannelLink:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-header > div > ul > li:nth-child(2) > div',
    tocPannel: '.toc',
  },
  entityView: {
    contentHeader: '#app > div.content > div > div > div.content-header.content-header-entity',
    contentHeaderTitle:
      '#app > div.content > div > div > div.content-header.content-header-entity > div.content-header-title > h1',
    editButton:
      '#app > div.content > div > div > div.sidepanel-footer > span > button.edit-metadata.btn.btn-primary',
    saveButton:
      '#app > div.content > div > div > div.sidepanel-footer > span > button.btn.btn-success',
    metadataForm: '#metadataForm',
    metadataFormTitle: '#metadataForm > div:nth-child(1) > ul > li.wide > div > textarea',
    metadataFormType: '#metadataForm > div:nth-child(2) > ul > li.wide > select',
    firstAttachmentTitle:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.attachments-list-parent > div.attachments-list > div > a > span > span:nth-child(1)',
    firstAttachmentEditTitleButton:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.attachments-list-parent > div.attachments-list > div > div > div > button:nth-child(1)',
    attachmentFormInput: '#attachmentForm > div > div > input',
    attachmentFormSubmit:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.attachments-list-parent > div.attachments-list > div > div.attachment-buttons > div > button.item-shortcut.btn.btn-success',
    conectionsTabLink:
      '#app > div.content > div > div > div > div.content-header-tabs > ul > li:nth-child(2) > div',
    connectionsListView:
      '#app > div.content > div > div > .entity-connections ul > li:nth-child(2) > div',
  },
  uploadsView: {
    uploadBox: '#app > div.content > div > div > main > div.upload-box',
    firstDocument:
      '#app > div.content > div > div > main > div.documents-list > div > div.item-group > div:nth-child(1)',
    newEntityButtom: '#app > div.content > div > div > div > div > button',
    saveButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.btn.btn-success',
    publishButton:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.publish.btn.btn-success',
    multiPublishButton:
      '#app > div.content > div > div > aside.side-panel.multi-edit.is-active > div.sidepanel-footer > button.publish.btn.btn-success',
    acceptPublishModel:
      'body > div.ReactModalPortal > div > div > div > div.modal-footer > button.btn.confirm-button.btn-success',
    metadataPanel: '.side-panel.metadata-sidepanel',
  },
  navigation: {
    loginNavButton: '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(2) > a',
    uploadsNavButton:
      '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(2) > a',
    libraryNavButton:
      '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(1) > a',
    settingsNavButton:
      '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(3) > a',
    spanish:
      '#app > div.content > header > ul > li.menuActions > ul.menuNav-I18NMenu > li:nth-child(2) > a',
    english:
      '#app > div.content > header > ul > li.menuActions > ul.menuNav-I18NMenu > li:nth-child(3) > a',
  },
  connections: {
    editButton: '#app > div.content > div > div > div.sidepanel-footer > span > button',
    saveButton:
      '#app > div.content > div > div > div.sidepanel-footer > span > button.btn.btn-success',
    newRelationshipButton:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.relationships-graph div.leftRelationshipType button.relationships-new',

    sortMenu:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.sort-by.centered > div.sort-buttons > div > ul > li.Dropdown-option.is-active > a:nth-child(1)',
    searchInput:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.search-list.centered > div > form > div > div > input',

    documentViewerConnectionsTab:
      '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-header > div > ul > li:nth-child(6) > div',

    rightHandRelationships:
      '#app > div.content > div > div > main > div > div.tab-content.tab-content-visible > div > div > div.relationships-graph > div:nth-child(2) > div:nth-child(1) > div.rightRelationships div.rightRelationshipsTypeGroup',

    rightHandPerpetratorOption: 'li:nth-child(2)',
    rightHandHerosOption: 'li:nth-child(4)',
    eventOption: 'li:nth-child(5)',
    interpretationOption: 'li:nth-child(6)',

    sidePanelViewEntityButton:
      '#app > div.content > div > div > aside.side-panel.connections-metadata.is-active > div.sidepanel-footer > span > a > button',
    sidePanelSearchInput:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body div.search-box input',
    sidePanelDocuments:
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div > div > div .item-name',
  },
  datePicker: {
    today:
      'body div.react-datepicker__month div.react-datepicker__day.react-datepicker__day--today',
  },
  newEntity: {
    form: {
      title: '#metadataForm > div:nth-child(1) > ul > li.wide > div > textarea',
      type: '#metadataForm > div:nth-child(2) > ul > li.wide > select',
      realName: '#metadataForm > div:nth-child(3) > div:nth-child(1) > ul > li.wide > div > input',
      age: '#metadataForm > div:nth-child(3) > div:nth-child(2) > ul > li.wide > input',
      knownAccomplices: {
        joker:
          '#metadataForm > div:nth-child(3) > div:nth-child(3) > ul > li.wide > ul > li:nth-child(3) > label',
      },
      mainSuperpower: '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > select',
      suporPowers: {
        fly:
          '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(3) > label',
        laserBeam:
          '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(8) > label',
        moreButton:
          '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(7) > button',
      },
      firstSighting:
        '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div > input',
      whoIsHe:
        '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.tab-content.tab-content-visible > textarea',
    },
    viewer: {
      title:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > div > div > h1',
      realName:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(2) > dd',
      age:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(3) > dd',
      knownAccomplices:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > dl:nth-child(4) > dd > ul > li > a',
      mainSuperpower:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(5) > dd',
      superpowers:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(6) > dd > ul',
      firstSight:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(7) > dd',
      whoIsHe:
        '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > dl:nth-child(8) > dd > div > p',
    },
  },
  review: {
    toggleFullEditButton:
      '#app > div.content > div > div > div > main > div.content-header.content-header-entity > button',
    documentCount:
      '#app > div.content > div > div > div > main > div.content-header.content-header-entity > div > div',
    previousDocumentButton:
      '#app > div.content > div > div > div > main > div.content-header.content-header-entity > div > span:nth-child(4) > button:nth-child(1)',
    nextDocumentButton:
      '#app > div.content > div > div > div > main > div.content-header.content-header-entity > div > span:nth-child(4) > button:nth-child(2)',
    topFirstSuggestion:
      '#sidePanelMetadataForm > div > div:nth-child(1) > ul > li:nth-child(2) > div > div:nth-child(2) > label > span.multiselectItem-icon',
    topFirstSuggestReject:
      '#sidePanelMetadataForm > div > div:nth-child(1) > ul > li:nth-child(2) > div > div:nth-child(2) > label > div',
    bottomFirstSuggestion:
      '#sidePanelMetadataForm > div > div:nth-child(2) > ul > li:nth-child(2) > div > div:nth-child(2) > label > span.multiselectItem-icon',
    bottomFirstSuggestReject:
      '#sidePanelMetadataForm > div > div:nth-child(2) > ul > li:nth-child(2) > div > div:nth-child(2) > label > div',
    firstMultiSelectItemSelected:
      '#sidePanelMetadataForm > div > div:nth-child(2) > ul > li:nth-child(3) > ul > li:nth-child(2) > label > span.multiselectItem-icon > svg.checkbox-checked',
    secondMultiSelectItem:
      '#sidePanelMetadataForm > div > div > ul > li:nth-child(3) > ul > li:nth-child(3) > label',
    secondMultiSelectItemSelected:
      '#sidePanelMetadataForm > div > div > ul > li:nth-child(3) > ul > li:nth-child(3) > label > span.multiselectItem-icon > svg.checkbox-checked',
    titleLabel:
      '#app > div.content > div > div > div > main > div.entity-viewer > div > div.tab-content.tab-content-visible > div > div > div.content-header-title > h1',
    titleEditBox: '#fullEditMetadataForm > div.form-group > ul > li.wide > div > textarea',
    discardButtonDisabled:
      '#app > div.content > div > div > div > main > div.content-footer > button.cancel-edit-metadata.btn-disabled',
    discardButtonEnabled:
      '#app > div.content > div > div > div > main > div.content-footer > button.cancel-edit-metadata.btn-danger',
    saveAndGoToNextEnabled:
      '#app > div.content > div > div > div > main > div.content-footer > button.save-and-next.btn-success',
    acceptConfirmDialog:
      'body > div:nth-child(7) > div > div > div > div.modal-footer > button.btn.confirm-button.btn-danger',
    cancelConfirmDialog:
      'body > div:nth-child(7) > div > div > div > div.modal-footer > button.btn.btn-default.cancel-button',
  },
};
