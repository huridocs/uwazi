import React, { useState, useCallback } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Panel } from 'V2/Components/Layouts/Panel';
import { BlankState } from '../BlankState';
import { EntityReference } from 'app/V2/domain/entities/types';
import { Reference } from './Reference';
import { pdfEventBus } from 'V2/Components/PDFViewer';
import { useAtomValue } from 'jotai';
import { pdfScaleAtom } from 'V2/atoms';

type ReferencesPanelProps = {
  references?: EntityReference[];
};

const ReferencesPanel = ({ references = [] }: ReferencesPanelProps) => {
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const pdfScale = useAtomValue(pdfScaleAtom);

  const handleReferenceClick = useCallback(
    (reference: EntityReference) => {
      setSelectedReferenceId(reference._id);

      // Scroll to the reference in the PDF
      const selectionRectangles = reference.reference.selectionRectangles;
      if (selectionRectangles && selectionRectangles.length > 0) {
        // Find the first rectangle with a page
        const rect = selectionRectangles.find(r => r.page);
        if (rect && rect.page && rect.top !== undefined && rect.left !== undefined) {
          const pageNumber = Number.parseInt(rect.page, 10);
          
          // Scale normalized coordinates (if stored at scale=1) to current display scale
          const scaledTop = (rect.top || 0) * pdfScale;
          const scaledLeft = (rect.left || 0) * pdfScale;

          // Scroll to the page first
          pdfEventBus.dispatch('goToPage', pageNumber);

          // Then scroll to the rectangle position
          setTimeout(() => {
            const pdfContainer = document.getElementById('pdf-container');
            const pageWrapper = pdfContainer?.querySelector(`#page-${pageNumber}-container`);
            const pageContainer = pageWrapper?.querySelector('[data-testid="pdf-page"]') as HTMLElement | null;

            if (pageContainer) {
              // Create a temporary element to scroll to
              const scrollElement = document.createElement('div');
              scrollElement.style.position = 'absolute';
              scrollElement.style.left = `${scaledLeft}px`;
              scrollElement.style.top = `${scaledTop}px`;
              scrollElement.style.width = '1px';
              scrollElement.style.height = '1px';
              scrollElement.style.pointerEvents = 'none';
              
              const currentPosition = getComputedStyle(pageContainer).position;
              if (currentPosition === 'static') {
                pageContainer.style.position = 'relative';
              }
              
              pageContainer.appendChild(scrollElement);
              scrollElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              
              setTimeout(() => {
                if (scrollElement.parentNode) {
                  scrollElement.parentNode.removeChild(scrollElement);
                }
                if (currentPosition === 'static') {
                  pageContainer.style.position = '';
                }
              }, 1000);
            }
          }, 300);
        }
      }
    },
    [pdfScale]
  );

  const handleView = useCallback((reference: EntityReference) => {
    // TODO: Implement view functionality
    console.log('View reference:', reference);
  }, []);

  const handleDelete = useCallback((reference: EntityReference) => {
    // TODO: Implement delete functionality
    console.log('Delete reference:', reference);
  }, []);

  return (
    <Panel className="gap-4">
      <Panel.Body className="pr-1">
        <div className="flex flex-col gap-2 h-full">
          {references.length > 0 ? (
            references.map((reference, index) => (
              <Reference
                key={reference._id || `reference-${index}`}
                reference={reference}
                isSelected={selectedReferenceId === reference._id}
                onClick={() => handleReferenceClick(reference)}
                onView={() => handleView(reference)}
                onDelete={() => handleDelete(reference)}
              />
            ))
          ) : (
            <BlankState
              icon={<LinkIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
              title={<Translate>No References</Translate>}
              description={
                <Translate>
                  To add references you can start by selecting text in the document
                </Translate>
              }
            />
          )}
        </div>
      </Panel.Body>

      <Panel.Footer>
        <div className="flex items-center justify-between w-full" />
      </Panel.Footer>
    </Panel>
  );
};

export { ReferencesPanel };
