import React, { useEffect } from 'react';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal, Tabs } from '#V2/Components/UI/index.js';
import { TabLabel } from '../TabLabel.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { FileDetailsView } from './FileDetailsView.js';
import { FileDetailsEditor } from './FileDetailsEditor.js';
import { TranslationsPanel } from './TranslationsPanel.js';

const FilesSidePanel = () => {
  const {
    focusedRow,
    primaryRows,
    drawerTab,
    setDrawerTab,
    isEditing,
    setIsEditing,
    setFocusedRowId,
    requestDeleteRow,
    pendingDeleteRow,
    closeDeleteModal,
    deleteRow,
    saveRow,
    uploadTranslation,
  } = useEntityFiles();
  const isPrimaryFocused = focusedRow?.category === 'primary';

  useEffect(() => {
    if (drawerTab === 'translations' && !isPrimaryFocused) {
      setDrawerTab('file');
    }
  }, [drawerTab, isPrimaryFocused, setDrawerTab]);

  return (
    <>
      <Tabs
        className="min-w-0 w-full border-l border-[color-mix(in_srgb,var(--color-theme-border-default)_65%,transparent)]"
        tabListAriaLabel="Files side panel tabs"
        domIdPrefix="entity-files-side"
        initialTabId={drawerTab}
        onTabSelected={tab => setDrawerTab(tab as 'file' | 'translations')}
        unmountTabs={false}
      >
        <Tabs.Tab id="file" label={<Translate>File</Translate>}>
          <div className="h-full overflow-auto p-3">
            {focusedRow ? (
              isEditing ? (
                <FileDetailsEditor
                  row={focusedRow}
                  onSave={saveRow}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <FileDetailsView
                  row={focusedRow}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => requestDeleteRow(focusedRow)}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted">
                <Translate>Select a file</Translate>
              </div>
            )}
          </div>
        </Tabs.Tab>
        {isPrimaryFocused ? (
          <Tabs.Tab
            id="translations"
            label={
              <TabLabel
                text="Translations"
                icon={<LanguageIcon className="w-5 h-5" />}
                count={primaryRows.length}
              />
            }
          >
            <div className="h-full overflow-auto p-3">
              <TranslationsPanel
                focusedRow={focusedRow}
                primaryRows={primaryRows}
                onFocusRow={row => {
                  setFocusedRowId(row.rowId);
                  setDrawerTab('file');
                }}
                onDeleteRow={requestDeleteRow}
                onUpload={uploadTranslation}
              />
            </div>
          </Tabs.Tab>
        ) : null}
      </Tabs>

      {pendingDeleteRow ? (
        <ConfirmationModal
          header="Delete file"
          body={`Are you sure you want to delete "${pendingDeleteRow.displayName}"?`}
          acceptButton="Delete"
          onCancelClick={closeDeleteModal}
          onAcceptClick={() => {
            void deleteRow();
          }}
          dangerStyle
        />
      ) : null}
    </>
  );
};

export { FilesSidePanel };
