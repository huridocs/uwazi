/*eslint max-len: ["error", 500]*/
export default {
  settingsView: {
    liElementsOfSection: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul > li',
    firstEditButton: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul > li:nth-child(1) > div > a > i',
    collectionNameForm: '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > form > div > input',
    settingsNavButton: '#app > div.content > header > div > div > ul > li:nth-child(3) > a',
    settingsHeader: '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(1) > div.panel-heading',
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
    unlinkIcon: '#app > div.content > div > div > aside.side-panel.document-metadata.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.item.relationship-active > div.item-actions > a:nth-child(1)',
    libraryFirstDocument: '.item-group .item',
    searchInLibrary: '#app > div.content > header > div > div > div > a > i.fa.fa-search',
    firstDocumentViewButton: '#app > div.content > div > div > main > div > div.item-group > div:nth-child(1) > div.item-actions > a',
    libraryNavButton: '#app > div.content > header > div > div > ul > li:nth-child(1) > a',
    loadTargetDocumentButton: '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-footer > button'
  },
  uploadsView: {
    uploadsNavButton: '.fa-cloud-upload',
    uploadBox: '#app > div.content > div > div > main > div:nth-child(1) > div',
    uploadsBottomRightSaveButton: '.float-btn'
  }
};
