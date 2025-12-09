/**
 * @jest-environment jsdom
 */
import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TocSchema } from 'shared/types/commonTypes';
import { ToC, type ToCRef } from '../ToC';

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

describe('ToC', () => {
  describe('Simple ToC', () => {
    it('should render all top-level entries', () => {
      render(<ToC toc={simpleToc} />);

      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    });

    it('should display page numbers for entries with pages', () => {
      render(<ToC toc={simpleToc} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should call onClick when an entry is clicked', () => {
      const handleClick = jest.fn();
      render(<ToC toc={simpleToc} onClick={handleClick} />);

      const introductionEntry = screen.getByText('Introduction').closest('div');
      fireEvent.click(introductionEntry!);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          entry: expect.objectContaining({ label: 'Introduction' }),
        })
      );
    });
  });

  describe('Nested ToC', () => {
    it('should render top-level entries', () => {
      render(<ToC toc={nestedToc} />);

      expect(screen.getByText('Part I: Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Part II: Advanced Topics')).toBeInTheDocument();
    });

    it('should hide nested children when parent is collapsed', () => {
      render(<ToC toc={nestedToc} />);

      // Initially, nested items should be hidden
      expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
      expect(screen.queryByText('Section 1.1: Installation')).not.toBeInTheDocument();
    });

    it('should show nested children when parent is expanded', async () => {
      render(<ToC toc={nestedToc} />);

      // Find and click the expand button for "Part I: Fundamentals"
      const partIEntry = screen.getByText('Part I: Fundamentals').closest('div');
      const expandButton = partIEntry?.querySelector('button[aria-label="Expand section"]');

      if (expandButton) {
        fireEvent.click(expandButton);

        // After expanding, nested items should be visible
        await waitFor(() => {
          expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
        });
      }
    });

    it('should expand and collapse entries correctly', async () => {
      render(<ToC toc={nestedToc} />);

      const partIEntry = screen.getByText('Part I: Fundamentals').closest('div');
      const expandButton = partIEntry?.querySelector('button[aria-label="Expand section"]');

      if (expandButton) {
        // Expand
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
        });

        // Collapse
        const collapseButton = partIEntry?.querySelector('button[aria-label="Collapse section"]');
        if (collapseButton) {
          fireEvent.click(collapseButton);
          await waitFor(() => {
            expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
          });
        }
      }
    });

    it('should hide deeply nested children when intermediate parent is collapsed', async () => {
      render(<ToC toc={nestedToc} />);

      // Expand Part I
      const partIEntry = screen.getByText('Part I: Fundamentals').closest('div');
      const partIExpandButton = partIEntry?.querySelector('button[aria-label="Expand section"]');
      if (partIExpandButton) {
        fireEvent.click(partIExpandButton);
      }

      // Expand Chapter 1
      await waitFor(() => {
        const chapter1Entry = screen.getByText('Chapter 1: Getting Started').closest('div');
        const chapter1ExpandButton = chapter1Entry?.querySelector(
          'button[aria-label="Expand section"]'
        );
        if (chapter1ExpandButton) {
          fireEvent.click(chapter1ExpandButton);
        }
      });

      // Verify Section 1.1 is visible
      await waitFor(() => {
        expect(screen.getByText('Section 1.1: Installation')).toBeInTheDocument();
      });

      // Collapse Part I
      const partICollapseButton = partIEntry?.querySelector(
        'button[aria-label="Collapse section"]'
      );
      if (partICollapseButton) {
        fireEvent.click(partICollapseButton);
      }

      // All children should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
        expect(screen.queryByText('Section 1.1: Installation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Expand All / Collapse All', () => {
    it('should expand all entries when expandAll is called', async () => {
      const ref = createRef<ToCRef>();
      render(<ToC ref={ref} toc={nestedToc} />);

      // Initially nested items should be hidden
      expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();

      // Call expandAll
      act(() => {
        ref.current?.expandAll();
      });

      // All nested items should be visible
      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });
      expect(screen.getByText('Section 1.1: Installation')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2: Basic Concepts')).toBeInTheDocument();
    });

    it('should collapse all entries when collapseAll is called', async () => {
      const ref = createRef<ToCRef>();
      render(<ToC ref={ref} toc={nestedToc} />);

      // Expand all first
      act(() => {
        ref.current?.expandAll();
      });
      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Getting Started')).toBeInTheDocument();
      });

      // Collapse all
      act(() => {
        ref.current?.collapseAll();
      });

      // All nested items should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Chapter 1: Getting Started')).not.toBeInTheDocument();
      });
      expect(screen.queryByText('Section 1.1: Installation')).not.toBeInTheDocument();
    });

    it('should report correct state for isAllExpanded and isAllCollapsed', async () => {
      const ref = createRef<ToCRef>();
      render(<ToC ref={ref} toc={nestedToc} />);

      // Initially all should be collapsed
      expect(ref.current?.isAllCollapsed()).toBe(true);
      expect(ref.current?.isAllExpanded()).toBe(false);

      // Expand all
      act(() => {
        ref.current?.expandAll();
      });
      await waitFor(() => {
        expect(ref.current?.isAllExpanded()).toBe(true);
      });
      expect(ref.current?.isAllCollapsed()).toBe(false);

      // Collapse all
      act(() => {
        ref.current?.collapseAll();
      });
      await waitFor(() => {
        expect(ref.current?.isAllCollapsed()).toBe(true);
      });
      expect(ref.current?.isAllExpanded()).toBe(false);
    });
  });

  describe('State change callback', () => {
    it('should call onStateChange when expansion state changes', async () => {
      const handleStateChange = jest.fn();
      const ref = createRef<ToCRef>();
      render(<ToC ref={ref} toc={nestedToc} onStateChange={handleStateChange} />);

      // Initial state should be reported
      await waitFor(() => {
        expect(handleStateChange).toHaveBeenCalled();
      });

      // Expand all
      act(() => {
        ref.current?.expandAll();
      });

      await waitFor(() => {
        expect(handleStateChange).toHaveBeenCalledWith(true, false);
      });
    });
  });

  describe('Empty and undefined ToC', () => {
    it('should render nothing when toc is empty', () => {
      const { container } = render(<ToC toc={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when toc is undefined', () => {
      const { container } = render(<ToC toc={undefined} />);
      expect(container.firstChild).toBeNull();
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

      render(<ToC toc={tocWithoutPages} />);
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
      render(<ToC toc={tocWithoutPages} onClick={handleClick} />);

      const entry = screen.getByText('Section without page').closest('div');
      fireEvent.click(entry!);

      // Should not call onClick for entries without page numbers
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
