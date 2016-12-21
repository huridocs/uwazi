/*eslint max-len: ["error", 500]*/
export default {
  settingsView: {
    liElementsOfSection: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul > li',
    firstEditButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul > li:nth-child(1) > div > a > i',
    collectionNameForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > form > div > input',
    settingsHeader: '#app > div.content > header > ul > li.menuActions > ul.menuNav-list > li:nth-child(3) > a',
    logoutButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div:nth-child(3) > div.panel-body > a',
    accountButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(1) > div.list-group > a:nth-child(1)',
    collectionButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(1) > div.list-group > a:nth-child(2)',
    dictionariesButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(3)',
    documentsButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
    entitiesButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(4)',
    connectionsButton: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(2)',
    dictionariesBackButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > a',
    documentsBackButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > a',
    connectionsBackButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading.relationType > a',
    entitiesBackButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > a',
    addNewDictionary: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a',
    addNewDocument: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a',
    addNewEntity: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a',
    addNewConnection: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a > span',
    addNewValueToDictionaryButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-body > a',
    firstDictionaryValForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(2) > div > div > input',
    secondDictionaryValForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(3) > div > div > input',
    saveDictionaryButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > button',
    saveDocumentButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > button',
    saveEntityButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > button',
    saveConnectionButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading.relationType > button',
    dictionaryNameForm: '#thesauriName',
    connectionNameForm: '#relationTypeName',
    entityNameForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > div > input',
    documentTemplateNameForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > div > input',
    deleteButtonConfirmation: 'body > div.ReactModalPortal > div > div > div > div.modal-footer > button.btn.confirm-button.btn-danger'
  },
  libraryView: {
    libraryFirstDocument: '#app > div.content > div > div > main > div > div.item-group > div',
    librarySecondDocument: '#app > div.content > div > div > main > div > div.item-group > div:nth-child(2)',
    librarySecondDocumentTitle: '#app > div.content > div > div > main > div > div.item-group > div:nth-child(2) > div.item-info > div',
    searchInLibrary: '#app > div.content > header > div > a',
    searchInput: '#app > div.content > header > div > div > form > div.input-group > input',
    firstSearchSuggestion: '#app > div.content > header > div > div > form > div.search-suggestions > p:nth-child(1) > a',
    firstDocumentViewButton: '#app > div.content > div > div > main > div > div.item-group > div:nth-child(1) > div.item-actions > a'
  },
  documentView: {
    documentPage: '.page',
    documentPageFirstParagraph: '.t:nth-child(4)',
    bottomRightMenu: '.fa-plus',
    bottomRightMenuIsActive: '.float-btn.active',
    bottomRightMenuAddParagraph: '.fa-paragraph',
    createReferenceSidePanelIsActive: '#app > div.content > div > div > aside.side-panel.create-reference.is-active',
    createReferenceSidePanelSelect: 'select.form-control',
    createReferenceSidePanelSelectFirstValue: 'a901de64992c1acddbbc2a930808377a',
    createReferenceSidePanelInput: '.input-group input[type="text"]',
    createReferenceSidePanelFirstSearchSuggestion: '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div > div:nth-child(1)',
    createReferenceSidePanelNextButton: '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-footer > button',
    targetDocument: '.document-viewer.show-target-document',
    saveConnectionButton: '#app > div.content > div > div > main > div > div > div > div.relationship-steps.is-fixed > button.btn.btn-success',
    activeConnection: '#app > div.content > div > div > aside:nth-child(4) > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.item.relationship-active',
    unlinkIcon: '#app > div.content > div > div > aside:nth-child(4) > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div:nth-child(1) > div.item-actions > div > a:nth-child(1)'

  },
  uploadsView: {
    uploadBox: '#app > div.content > div > div > main > div:nth-child(1) > div',
    //uploadsBottomRightSaveButton: '#app > div.content > div > div > aside > div.sidepanel-footer > button.edit-metadata.btn.btn-success',
    firstDocument: '#app > div.content > div > div > main > div.item-group > div'
  },
  navigation: {
    loginNavButton: '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(2) > a',
    uploadsNavButton: '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(2) > a',
    libraryNavButton: '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(1) > a',
    settingsNavButton: '#app > div.content > header > ul > li.menuActions > ul > li:nth-child(3) > a'
  }
};
