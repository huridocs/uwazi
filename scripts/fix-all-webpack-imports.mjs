import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const fileMappings = {
  'V2/Components/ErrorHandling/index.js': 'V2/Components/ErrorHandling/index.ts',
  'V2/atoms/index.js': 'V2/atoms/index.ts',
  'store.js': 'store.ts',
  'appRoutes.jsx': 'appRoutes.js',
  'I18N/index.js': 'I18N/index.ts',
  'utils/RequestParams.js': 'utils/RequestParams.ts',
  'utils/debounce.js': 'utils/debounce.ts',
  'components/UploadAttachment': 'Attachments/components/UploadAttachment.tsx',
  'reducers/manageAttachmentsReducer': 'Attachments/reducers/manageAttachmentsReducer.js',
  'reducers/reducer': 'Attachments/reducers/reducer.js',
  'components/RenderAttachment': 'Attachments/components/RenderAttachment.tsx',
  'components/AttachmentsList': 'Attachments/components/AttachmentsList.tsx',
  'components/AttachmentsModal': 'Attachments/components/AttachmentsModal.tsx',
  'DocumentsAPI': 'Documents/DocumentsAPI.js',
  'components/TocForm': 'Documents/components/TocForm.tsx',
  'components/ShowToc': 'Documents/components/ShowToc.tsx',
  'components/DocumentSidePanel': 'Documents/components/DocumentSidePanel.tsx',
  'EntitiesAPI': 'Entities/EntitiesAPI.js',
  'connectionReducer': 'Connections/reducers/connectionReducer.js',
  'documentsReducer.js': 'Library/reducers/documentsReducer.js',
  'uiReducer.js': 'Pages/reducers/uiReducer.js',
  'filtersReducer.js': 'Library/reducers/filtersReducer.js',
  'aggregationsReducer.js': 'Library/reducers/aggregationsReducer.js',
  'actions/actions': 'Metadata/actions/actions.js',
  'containers/FormatMetadata': 'Metadata/containers/FormatMetadata.tsx',
  'components/ShowMetadata': 'Metadata/components/ShowMetadata.tsx',
  'helpers/formater': 'Metadata/helpers/formater.js',
  'helpers/validator': 'Metadata/helpers/validator.js',
  'components/MetadataForm': 'Metadata/components/MetadataForm.tsx',
  'components/MetadataFormButtons': 'Metadata/components/MetadataFormButtons.tsx',
  'components/MetadataFormFields': 'Metadata/components/MetadataFormFields.tsx',
  'components/SelectMultiplePanel': 'Metadata/components/SelectMultiplePanel.tsx',
  'helpers/wrapper': 'Metadata/helpers/wrapper.js',
  'reducers/progressReducer': 'Metadata/reducers/progressReducer.js',
  'actions/notificationsActions': 'Notifications/actions/notificationsActions.js',
  'components/Notifications': 'Notifications/components/Notifications.tsx',
  'hubsReducer': 'Relationships/reducers/hubsReducer.js',
  'hubActionsReducer': 'Relationships/reducers/hubActionsReducer.js',
  'utils/routeHelpers.js': 'utils/routeHelpers.ts',
  'quickLabelActions': 'Library/actions/quickLabelActions.js',
  'helpers/publishedStatusFilter': 'Library/helpers/publishedStatusFilter.js',
  'saveEntityWithFiles': 'Library/actions/saveEntityWithFiles.js',
  'Library/reducers/exportReducer.js': 'Library/reducers/exportReducer.js',
  'Notifications/index.js': 'Notifications/index.js',
  'App/Cookiepopup.js': 'App/Cookiepopup.tsx',
  'UI/index.js': 'V2/Components/UI/index.ts',
  'socket.js': 'socket.js',
  'V2/Components/UI/NotificationsContainer.js': 'V2/Components/UI/NotificationsContainer.tsx',
  'V2/Components/Analitycs/index.js': 'V2/Components/Analitycs/index.ts',
  'V2/Components/Analitycs/index.jsx': 'V2/Components/Analitycs/index.ts',
  'V2/atoms/settingsAtom.js': 'V2/atoms/settingsAtom.ts',
  'V2/atoms/translationsAtoms.js': 'V2/atoms/translationsAtoms.ts',
  'I18N/index.js': 'I18N/index.ts',
  'I18N/TranslateModal.jsx': 'I18N/TranslateModal.tsx',
  'App/Cookiepopup.jsx': 'App/Cookiepopup.tsx',
  'V2/atoms/settingsAtom.jsx': 'V2/atoms/settingsAtom.ts',
  'App/libraryViewInfo.js': 'App/libraryViewInfo.ts',
  'Multireducer/index.js': 'Multireducer/index.js',
  'Notifications/actions/notificationsActions.js': 'Notifications/actions/notificationsActions.js',
  'utils/getFileExtension.js': 'utils/getFileExtension.ts',
  'App/Confirm.js': 'App/Confirm.tsx',
  'App/Menu.js': 'App/Menu.tsx',
  'App/AppMainContext.js': 'App/AppMainContext.ts',
  'App/SiteName.js': 'App/SiteName.tsx',
  'App/GoogleAnalytics.js': 'App/GoogleAnalytics.tsx',
};

const replacements = [];

for (const [wrongPath, correctPath] of Object.entries(fileMappings)) {
  const patterns = [
    new RegExp(`(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
    new RegExp(`(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.js(['"])`, 'g'),
    new RegExp(`from\\s+(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
    new RegExp(`from\\s+(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.js(['"])`, 'g'),
  ];
  
  const ext = correctPath.match(/\.(js|jsx|ts|tsx)$/)?.[0] || '.js';
  const finalPath = correctPath.replace(/\.(js|jsx|ts|tsx)$/, ext);
  
  replacements.push({
    from: new RegExp(`(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
    to: `$1#app/${finalPath}$2`,
  });
  
  replacements.push({
    from: new RegExp(`from\\s+(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
    to: `from $1#app/${finalPath}$2`,
  });
}

const files = await glob('app/react/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
