import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const fileMappings = {
  'UploadSupportingFile': 'Attachments/components/UploadSupportingFile.jsx',
  'SearchText': 'Documents/components/SearchText.jsx',
  'ShowToc': 'Documents/components/ShowToc.jsx',
  'SnippetsTab': 'Documents/components/SnippetsTab.jsx',
  'AttachmentsModal': 'Attachments/components/AttachmentsModal.jsx',
  'SnippetList': 'Documents/components/SnippetList.jsx',
  'components/Welcome.js': 'Layout/components/Welcome.jsx',
  'TilesViewer.js': 'Layout/TilesViewer.jsx',
  'CollectionViewerProps': 'Layout/CollectionViewerProps.ts',
  'Lists': 'Layout/Lists.tsx',
  'istore.js': 'istore.ts',
  'components/LibraryFooter': 'Library/components/LibraryFooter.tsx',
  'libraryActions': 'Library/actions/libraryActions.js',
  'PermissionsFilter.js': 'Library/components/PermissionsFilter.tsx',
  'PublishedFilters.js': 'Library/components/PublishedFilters.tsx',
  'FiltersFromProperties.js': 'Library/components/FiltersFromProperties.tsx',
  'DateFilter': 'Library/components/DateFilter.tsx',
  'NestedFilter': 'Library/components/NestedFilter.tsx',
  'NumberRangeFilter': 'Library/components/NumberRangeFilter.tsx',
  'SelectFilter': 'Library/components/SelectFilter.tsx',
  'TextFilter': 'Library/components/TextFilter.tsx',
  'ExportButton': 'Library/components/ExportButton.tsx',
  'PDFUploadButton': 'Library/components/PDFUploadButton.tsx',
  'FiltrablePermissionsLevels': 'Library/components/FiltrablePermissionsLevels.ts',
  'docState': 'Library/docState.js',
  'helpers/defaultTemplate': 'Metadata/helpers/defaultTemplate.js',
  'IconField': 'Metadata/components/IconField.tsx',
  'MetadataFormFields': 'Metadata/components/MetadataFormFields.tsx',
  'SupportingFiles': 'Metadata/components/SupportingFiles.tsx',
  'PDFUpload': 'Metadata/components/PDFUpload.tsx',
  'SearchEntities': 'Metadata/components/SearchEntities.tsx',
  'GeolocationViewer.js': 'Metadata/components/GeolocationViewer.tsx',
  'RelationshipLink.js': 'Metadata/components/RelationshipLink.tsx',
  'ValueList.js': 'Metadata/components/ValueList.tsx',
  'ImageViewer.js': 'Metadata/components/ImageViewer.tsx',
  'AddThesauriValueModal': 'Metadata/components/AddThesauriValueModal.tsx',
  'actions/metadataExtractionActions': 'Metadata/actions/metadataExtractionActions.ts',
  'MediaModalUploadFileButton': 'Metadata/components/MediaModalUploadFileButton.tsx',
  'V2/Components/Forms/MetadataFormFiles.jsx': 'Metadata/components/MetadataFormFiles.tsx',
  'MetadataForm.js': 'Metadata/components/MetadataForm.tsx',
  'helpers/comonTemplate.js': 'Metadata/helpers/comonTemplate.js',
  'actions/supportingFilesActions': 'Metadata/actions/supportingFilesActions.js',
  'Layout/index/index.js': 'Layout/index.ts',
  'selectors': 'Metadata/selectors.ts',
  'components/Metadata': 'Metadata/components/Metadata.tsx',
  'actions/actions.js': 'ConnectionsList/actions/actions.js',
};

const files = await glob('app/react/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const [wrongPath, correctPath] of Object.entries(fileMappings)) {
    const patterns = [
      new RegExp(`(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
      new RegExp(`from\\s+(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
      new RegExp(`import\\s+.*?from\\s+(['"])#app/${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern, (match, quote1, quote2) => {
        return match.replace(wrongPath, correctPath);
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✨ Fixed ${totalFixed} files`);
