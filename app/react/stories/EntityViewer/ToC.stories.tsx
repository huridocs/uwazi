/* eslint-disable max-lines */

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TocSchema } from '#shared/types/commonTypes.js';
import { ToC, type ProcessedTocEntry } from '#V2/Routes/Entity/Components/ToC/index.js';
import { normalizeToc, findItemsWithChildren } from '#V2/Routes/Entity/Components/ToC/index.js';

const meta: Meta<typeof ToC> = {
  title: 'EntityViewer/ToC',
  component: ToC,
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj<typeof ToC>;

// Mock data for stories
const simpleToc: TocSchema[] = [
  {
    label: 'Introduction',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '1' }],
  },
  {
    label: 'Chapter 1',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '5' }],
  },
  {
    label: 'Chapter 2',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '10' }],
  },
];

const nestedToc: TocSchema[] = [
  {
    label: 'Part I: Fundamentals',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '1' }],
  },
  {
    label: 'Chapter 1: Getting Started',
    indentation: 1,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '2' }],
  },
  {
    label: 'Section 1.1: Installation',
    indentation: 2,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '3' }],
  },
  {
    label: 'Section 1.2: Configuration',
    indentation: 2,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '4' }],
  },
  {
    label: 'Chapter 2: Basic Concepts',
    indentation: 1,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '5' }],
  },
  {
    label: 'Part II: Advanced Topics',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '10' }],
  },
  {
    label: 'Chapter 3: Advanced Patterns',
    indentation: 1,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '11' }],
  },
];

const ToCWithControls = ({
  toc,
  onClick,
}: {
  toc?: TocSchema[];
  onClick?: (entry: ProcessedTocEntry) => void;
}) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [isAllCollapsed, setIsAllCollapsed] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedToc, setEditedToc] = useState<TocSchema[] | undefined>(toc);

  // Update editedToc when toc prop changes
  React.useEffect(() => {
    setEditedToc(toc);
  }, [toc]);

  const handleStateChange = (expandedState: boolean, collapsed: boolean) => {
    setIsAllExpanded(expandedState);
    setIsAllCollapsed(collapsed);
  };

  const handleToggleExpand = (index: number) => {
    setExpanded(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleExpandAll = () => {
    if (!editedToc) return;
    const normalized = normalizeToc(editedToc);
    const itemsWithChildren = findItemsWithChildren(normalized);
    const allExpanded: Record<number, boolean> = {};
    itemsWithChildren.forEach(index => {
      allExpanded[index] = true;
    });
    setExpanded(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpanded({});
  };

  const handleEdit = () => {
    setIsEditMode(true);
    // Save current state as backup for cancel
    setEditedToc(toc ? [...toc] : undefined);
  };

  const handleSave = () => {
    setIsEditMode(false);
    // TODO: Implement save logic
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

  return (
    <div className="tw-content max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <button
                type="button"
                onClick={handleExpandAll}
                disabled={isAllExpanded}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                disabled={isAllCollapsed}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                Edit Mode
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <ToC
            toc={editedToc}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
            onClick={onClick}
            onStateChange={handleStateChange}
            isEditMode={isEditMode}
            onIndentationChange={handleIndentationChange}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

const ToCWrapper = ({ toc }: { toc?: TocSchema[] }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  return (
    <div className="tw-content max-w-md">
      <div className="flex flex-col gap-2">
        <ToC
          toc={toc}
          expanded={expanded}
          onToggleExpand={(index: number) => {
            setExpanded(prev => ({
              ...prev,
              [index]: !prev[index],
            }));
          }}
        />
      </div>
    </div>
  );
};

const Primary: Story = {
  render: args => <ToCWrapper toc={args.toc} />,
};

export const Simple = {
  ...Primary,
  args: {
    toc: simpleToc,
  },
};

export const Nested: Story = {
  render: () => <ToCWithControls toc={nestedToc} />,
};
export default meta;
