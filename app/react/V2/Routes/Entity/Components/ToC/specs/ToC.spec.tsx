/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { TocSchema } from '#shared/types/commonTypes.js';
import { ToC } from '../ToC.js';

// Test data
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

const rowFor = (label: string): HTMLElement =>
  screen.getByText(label).closest('[role="button"]') as HTMLElement;

// Helper component to provide expanded state
const ToCWithState = ({
  toc,
  ...props
}: {
  toc?: TocSchema[];
  onClick?: (entry: any) => void;
  onStateChange?: (expanded: boolean, collapsed: boolean) => void;
  isEditMode?: boolean;
  currentPage?: number;
  onIndentationChange?: (index: number, indentation: number) => void;
  onDelete?: (index: number) => void;
  onLabelChange?: (index: number, label: string) => void;
}) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggleExpand = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };
  return <ToC toc={toc} expanded={expanded} onToggleExpand={toggleExpand} {...props} />;
};

describe('ToC', () => {
  describe('Simple ToC', () => {
    it('should render all top-level entries', () => {
      render(<ToCWithState toc={simpleToc} />);

      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    });

    it('should display page tags for entries with pages', () => {
      render(<ToCWithState toc={simpleToc} />);

      expect(
        within(rowFor('Introduction')).getByRole('button', { name: /p\.\s*1/ })
      ).toBeInTheDocument();
      expect(
        within(rowFor('Chapter 1')).getByRole('button', { name: /p\.\s*5/ })
      ).toBeInTheDocument();
      expect(
        within(rowFor('Chapter 2')).getByRole('button', { name: /p\.\s*10/ })
      ).toBeInTheDocument();
    });

    it('should call onClick when an entry is clicked', () => {
      const handleClick = jest.fn();
      render(<ToCWithState toc={simpleToc} onClick={handleClick} />);

      fireEvent.click(rowFor('Introduction'));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          entry: expect.objectContaining({ label: 'Introduction' }),
        })
      );
    });

    it('should highlight the active entry for the current page', () => {
      render(<ToCWithState toc={simpleToc} currentPage={5} />);

      expect(rowFor('Chapter 1')).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Nested ToC', () => {
    it('should render top-level entries', () => {
      render(<ToCWithState toc={nestedToc} />);

      expect(screen.getByText('Part I: Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Part II: Advanced Topics')).toBeInTheDocument();
    });

    it('should hide nested children when parent is collapsed', () => {
      render(<ToCWithState toc={nestedToc} />);

      expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
      expect(screen.queryByText('Section 1.1: Installation')).not.toBeInTheDocument();
    });

    it('should show nested children when parent is expanded', async () => {
      render(<ToCWithState toc={nestedToc} />);

      fireEvent.click(rowFor('Part I: Fundamentals'));

      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });
    });

    it('should expand and collapse entries correctly', async () => {
      render(<ToCWithState toc={nestedToc} />);

      fireEvent.click(rowFor('Part I: Fundamentals'));
      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });

      fireEvent.click(rowFor('Part I: Fundamentals'));
      await waitFor(() => {
        expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
      });
    });

    it('should hide deeply nested children when intermediate parent is collapsed', async () => {
      render(<ToCWithState toc={nestedToc} />);

      fireEvent.click(rowFor('Part I: Fundamentals'));

      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });

      fireEvent.click(rowFor('Chapter 1: Getting Started'));

      await waitFor(() => {
        expect(screen.getByText('Section 1.1: Installation')).toBeInTheDocument();
      });

      fireEvent.click(rowFor('Part I: Fundamentals'));

      await waitFor(() => {
        expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
        expect(screen.queryByText('Section 1.1: Installation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Expand All / Collapse All', () => {
    it('should expand entries when row is clicked', async () => {
      render(<ToCWithState toc={nestedToc} />);

      expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();

      fireEvent.click(rowFor('Part I: Fundamentals'));

      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });
    });
  });

  describe('State change callback', () => {
    it('should call onStateChange when expansion state changes', async () => {
      const handleStateChange = jest.fn();
      render(<ToCWithState toc={nestedToc} onStateChange={handleStateChange} />);

      await waitFor(() => {
        expect(handleStateChange).toHaveBeenCalled();
      });

      fireEvent.click(rowFor('Part I: Fundamentals'));

      await waitFor(() => {
        expect(handleStateChange).toHaveBeenCalled();
      });
    });
  });

  describe('Empty and undefined ToC', () => {
    it('should render an empty container when toc is empty', () => {
      const { container } = render(<ToCWithState toc={[]} />);
      expect(container.querySelector('.pb-8')).toBeInTheDocument();
      expect(container.querySelector('.pb-8')?.childElementCount).toBe(0);
    });

    it('should render an empty container when toc is undefined', () => {
      const { container } = render(<ToCWithState toc={undefined} />);
      expect(container.querySelector('.pb-8')).toBeInTheDocument();
      expect(container.querySelector('.pb-8')?.childElementCount).toBe(0);
    });
  });

  describe('Entries without page numbers', () => {
    it('should render entries without page numbers', () => {
      const tocWithoutPages: TocSchema[] = [
        {
          label: 'Section without page',
          indentation: 0,
        },
      ];

      render(<ToCWithState toc={tocWithoutPages} />);
      expect(screen.getByText('Section without page')).toBeInTheDocument();
    });

    it('should not be clickable when entry has no page number', () => {
      const tocWithoutPages: TocSchema[] = [
        {
          label: 'Section without page',
          indentation: 0,
        },
      ];

      const handleClick = jest.fn();
      render(<ToCWithState toc={tocWithoutPages} onClick={handleClick} />);

      fireEvent.click(screen.getByText('Section without page'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
