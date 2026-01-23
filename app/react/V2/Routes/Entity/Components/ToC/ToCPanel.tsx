import React, { useState, useEffect, useCallback } from 'react';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { ListBulletIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { TocSchema } from '#shared/types/commonTypes.js';
import { Tooltip } from 'flowbite-react';
import { Panel } from '#V2/Components/Layouts/Panel.jsx';
import { update as updateFile } from '#V2/api/files/index.js';
import { FileType } from '#shared/types/fileType.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { Button } from '#V2/Components/UI/Button.jsx';
import { NeedAuthorization } from '#V2/Components/UI/index.js';
import { notificationAtom } from '#V2/atoms/index.js';
import { BlankState } from '#V2/Routes/Entity/Components/BlankState.jsx';
import {
  ToC,
  type ProcessedTocEntry,
  sortTocEntries,
} from '#V2/Routes/Entity/Components/ToC/ToC.jsx';
import { scrollToPage } from '#V2/Routes/Entity/Components/functions.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { useToc, useTocActions } from '#V2/Routes/Entity/Components/ToC/tocAtom.js';
import { getPageNumber } from '#V2/Routes/Entity/Components/ToC/utils.js';

const ToCPanel = ({
  toc,
  generatedToc,
  file,
}: {
  toc?: TocSchema[];
  generatedToc?: boolean;
  file?: FileType;
}) => {
  const revalidator = useRevalidator();
  const setNotification = useSetAtom(notificationAtom);
  const tocState = useToc();
  const {
    setToc,
    expandAll,
    collapseAll,
    setEditMode,
    updateEntry,
    deleteEntry,
    toggleExpand,
    reset: resetToc,
  } = useTocActions();

  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isAllCollapsed, setIsAllCollapsed] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize atom with prop data on mount and when toc prop changes
  useEffect(() => {
    setToc(toc);
  }, [toc, setToc]);

  // Cleanup atom on unmount
  useEffect(
    () => () => {
      resetToc();
    },
    [resetToc]
  );

  const handleStateChange = (expanded: boolean, collapsed: boolean) => {
    setIsAllExpanded(expanded);
    setIsAllCollapsed(collapsed);
  };

  const handleToCEntryClick = useCallback((entry: ProcessedTocEntry) => {
    const pageNumber = getPageNumber(entry.entry);
    if (pageNumber !== null) {
      scrollToPage(pageNumber);
    }
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!file || !file._id || !tocState.toc) {
      setEditMode(false);
      return;
    }

    setIsSaving(true);
    try {
      // Sort entries before saving to match display order
      const sortedToc = sortTocEntries(tocState.toc);
      const updatedFile: FileType = {
        ...file,
        toc: sortedToc,
      };
      const result = await updateFile(updatedFile);

      if (result instanceof FetchResponseError || result instanceof Error) {
        setNotification({
          type: 'error',
          text: <Translate>Failed to save table of contents</Translate>,
        });
        // Don't exit edit mode on error so user can retry
      } else {
        // Success - invalidate cache and revalidate to get the latest data from the server
        if (file.entity) {
          entityLoaderCache.invalidateEntity(file.entity);
        }
        await revalidator.revalidate();
        setNotification({
          type: 'success',
          text: <Translate>Table of contents saved successfully</Translate>,
        });
        setEditMode(false);
      }
    } catch (error) {
      setNotification({
        type: 'error',
        text: <Translate>Failed to save table of contents</Translate>,
      });
      // Don't exit edit mode on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    // Restore original toc
    setToc(toc);
  };

  const handleEntryUpdate = useCallback(
    (index: number, updates: Partial<TocSchema>) => {
      if (!tocState.toc) return;
      updateEntry(index, updates);
    },
    [tocState.toc, updateEntry]
  );

  const handleIndentationChange = useCallback(
    (index: number, newIndentation: number) => {
      handleEntryUpdate(index, { indentation: newIndentation });
    },
    [handleEntryUpdate]
  );

  const handleDelete = useCallback(
    (index: number) => {
      if (!tocState.toc) return;
      deleteEntry(index);
    },
    [tocState.toc, deleteEntry]
  );

  const handleLabelChange = useCallback(
    (index: number, newLabel: string) => {
      handleEntryUpdate(index, { label: newLabel });
    },
    [handleEntryUpdate]
  );

  return (
    <Panel className="gap-4">
      <Panel.Body className="px-1">
        <div className="flex flex-col gap-2 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 py-2">
              <p className="text-sm font-bold text-gray-900">
                <Translate>Table of contents</Translate>
              </p>
              {generatedToc && (
                <Tooltip
                  // eslint-disable-next-line react/style-prop-object
                  style="light"
                  arrow={false}
                  content="This table of contents was automatically created by the system."
                >
                  <span className="text-xs font-semibold text-blue-900 px-2 py-0.5 rounded-full tracking-wide flex items-center gap-1">
                    <Translate className="sr-only">auto created</Translate>
                    <SparklesIcon className="w-5 h-5 text-blue-900" />
                  </span>
                </Tooltip>
              )}
            </div>
            {tocState.toc && tocState.toc.length > 0 && !tocState.isEditMode && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={expandAll}
                  disabled={isAllExpanded}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                >
                  <Translate>Expand All</Translate>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  disabled={isAllCollapsed}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                >
                  <Translate>Collapse All</Translate>
                </button>
              </div>
            )}
          </div>
          {tocState.toc && tocState.toc.length > 0 ? (
            <ToC
              toc={tocState.toc}
              expanded={tocState.expanded}
              onToggleExpand={toggleExpand}
              onClick={handleToCEntryClick}
              onStateChange={handleStateChange}
              isEditMode={tocState.isEditMode}
              onIndentationChange={handleIndentationChange}
              onDelete={handleDelete}
              onLabelChange={handleLabelChange}
            />
          ) : (
            <BlankState
              icon={
                <ListBulletIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
              }
              title={<Translate>No Table of contents</Translate>}
              description={
                <Translate>
                  You can start by selecting text in the document and clicking the "Add to ToC"
                  button.
                </Translate>
              }
            />
          )}
        </div>
      </Panel.Body>

      <Panel.Footer>
        <div className="flex gap-2">
          {!tocState.isEditMode ? (
            <>
              <NeedAuthorization roles={['admin', 'editor']}>
                <Button styling="outline" onClick={handleEdit}>
                  <Translate>Edit</Translate>
                </Button>
              </NeedAuthorization>
              <NeedAuthorization roles={['admin', 'editor']}>
                <Button styling="outline">
                  <Translate>Mark as reviewed</Translate>
                </Button>
              </NeedAuthorization>
            </>
          ) : (
            <>
              <Button color="success" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Translate>Saving...</Translate> : <Translate>Save</Translate>}
              </Button>
              <Button styling="outline" onClick={handleCancel}>
                <Translate>Cancel</Translate>
              </Button>
            </>
          )}
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { ToCPanel };
