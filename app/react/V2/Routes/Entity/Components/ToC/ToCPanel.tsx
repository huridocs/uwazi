import React, { useRef, useState } from 'react';
import { useRevalidator } from 'react-router';
import { ListBulletIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { TocSchema } from 'shared/types/commonTypes';
import { Tooltip } from 'flowbite-react';
import { Panel } from 'V2/Components/Layouts/Panel';
import { update as updateFile } from 'V2/api/files';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';
import { Button } from 'V2/Components/UI/Button';
import { BlankState } from '../BlankState';
import { ToC, type ProcessedTocEntry, type ToCRef, sortTocEntries } from './ToC';
import { scrollToPage } from '../functions';
import { entityLoaderCache } from '../../EntityLoaderCache';

const getPageNumber = (entry: TocSchema) => {
  const page = entry.selectionRectangles?.find(rect => rect.page)?.page;
  if (!page) {
    return null;
  }
  const parsed = Number.parseInt(page, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const handleToCEntryClick = (entry: ProcessedTocEntry) => {
  const pageNumber = getPageNumber(entry.entry);
  if (typeof pageNumber === 'number') {
    scrollToPage(pageNumber);
  }
};

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
  const tocRef = useRef<ToCRef>(null);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isAllCollapsed, setIsAllCollapsed] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedToc, setEditedToc] = useState<TocSchema[] | undefined>(toc);
  const [isSaving, setIsSaving] = useState(false);

  // Update editedToc when toc prop changes
  React.useEffect(() => {
    setEditedToc(toc);
  }, [toc]);

  const handleStateChange = (expanded: boolean, collapsed: boolean) => {
    setIsAllExpanded(expanded);
    setIsAllCollapsed(collapsed);
  };

  const handleExpandAll = () => {
    tocRef.current?.expandAll();
  };

  const handleCollapseAll = () => {
    tocRef.current?.collapseAll();
  };

  const handleEdit = () => {
    setIsEditMode(true);
    // Save current state as backup for cancel
    setEditedToc(toc ? [...toc] : undefined);
  };

  const handleSave = async () => {
    if (!file || !file._id || !editedToc) {
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);
    try {
      // Sort entries before saving to match display order
      const sortedToc = sortTocEntries(editedToc);
      const updatedFile: FileType = {
        ...file,
        toc: sortedToc,
      };
      const result = await updateFile(updatedFile);

      if (result instanceof FetchResponseError || result instanceof Error) {
        // Handle error - you might want to show a toast or error message
        console.error('Failed to save ToC:', result);
        // Don't exit edit mode on error so user can retry
      } else {
        // Success - invalidate cache and revalidate to get the latest data from the server
        if (file.entity) {
          entityLoaderCache.invalidateEntity(file.entity);
        }
        await revalidator.revalidate();
        // Exit edit mode after revalidation completes
        // editedToc will be synced with updated toc prop via useEffect
        setIsEditMode(false);
      }
    } catch (error) {
      // Handle error - you might want to show a toast or error message
      console.error('Failed to save ToC:', error);
      // Don't exit edit mode on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    // Restore original toc
    setEditedToc(toc);
  };

  const handleIndentationChange = (index: number, newIndentation: number) => {
    if (!editedToc) return;

    const updatedToc = [...editedToc];
    if (updatedToc[index]) {
      updatedToc[index] = {
        ...updatedToc[index],
        indentation: newIndentation,
      };
      setEditedToc(updatedToc);
    }
  };

  const handleDelete = (index: number) => {
    if (!editedToc) return;

    const updatedToc = editedToc.filter((_, i) => i !== index);
    setEditedToc(updatedToc);
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    if (!editedToc) return;

    const updatedToc = [...editedToc];
    if (updatedToc[index]) {
      updatedToc[index] = {
        ...updatedToc[index],
        label: newLabel,
      };
      setEditedToc(updatedToc);
    }
  };

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
            {toc && toc.length > 0 && !isEditMode && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  disabled={isAllExpanded}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                >
                  <Translate>Expand All</Translate>
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  disabled={isAllCollapsed}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                >
                  <Translate>Collapse All</Translate>
                </button>
              </div>
            )}
          </div>
          {editedToc && editedToc.length > 0 ? (
            <ToC
              ref={tocRef}
              toc={editedToc}
              onClick={handleToCEntryClick}
              onStateChange={handleStateChange}
              isEditMode={isEditMode}
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
                  You can start by selecting text in the document and clicking the &quot;Add to
                  ToC&quot; button.
                </Translate>
              }
            />
          )}
        </div>
      </Panel.Body>

      <Panel.Footer>
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <Button styling="outline" onClick={handleEdit}>
                <Translate>Edit</Translate>
              </Button>
              <Button styling="outline">
                <Translate>Mark as reviewed</Translate>
              </Button>
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
