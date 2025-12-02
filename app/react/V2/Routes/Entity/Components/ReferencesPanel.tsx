import React, { useMemo } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { Panel } from 'V2/Components/Layouts/Panel';
import { EntityRelation } from 'V2/domain';
import { BlankState } from './BlankState';

type ReferencesPanelProps = {
  relations?: EntityRelation[];
};

const ReferencesPanel = ({ relations }: ReferencesPanelProps) => {
  const references = useMemo(() => {
    if (!relations || !Array.isArray(relations)) {
      return [];
    }
    return relations.filter(relation => relation.reference);
  }, [relations]);

  const getTemplateName = (templateId?: string | null): string => {
    if (!templateId) {
      return '';
    }
    // TODO: Get template name from templates atom or context
    return templateId;
  };

  return (
    <Panel className="gap-4">
      <Panel.Body className="pr-1">
        <div className="flex flex-col gap-2 h-full">
          {references.length > 0 ? (
            references.map((reference, index) => {
              const entityTitle = reference.entityData?.title || 'Untitled';
              const templateId = reference.entityData?.template || reference.template;
              const templateName = getTemplateName(templateId);
              const referenceText = reference.reference?.text || '';

              return (
                <div
                  key={reference._id || `reference-${index}`}
                  className="border border-gray-100 rounded-xl shadow-sm p-4 bg-white flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-gray-900">{entityTitle}</h3>
                    {templateName && <p className="text-xs text-gray-600">{templateName}</p>}
                  </div>

                  {referenceText && (
                    <p className="text-sm text-gray-700 leading-relaxed">{referenceText}</p>
                  )}

                  {templateId && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          templateId ? 'text-purple-900 bg-purple-50' : 'text-red-900 bg-red-50'
                        }`}
                      >
                        {templateId ? 'IACourt Judge' : 'Order of the judge'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <Translate>View</Translate>
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <Translate>Delete</Translate>
                    </button>
                  </div>
                </div>
              );
            })
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
        <div className="flex items-center justify-between w-full">
          <p className="text-sm text-gray-600">
            <Translate>To Add references check this guide</Translate>{' '}
            <button
              type="button"
              className="underline text-left"
              onClick={() => {
                // TODO: Implement guide link navigation
              }}
            >
              <Translate>here</Translate>
            </button>
            .
          </p>
          <button
            type="button"
            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
            aria-label="Help"
          >
            <span className="text-xs text-gray-700">?</span>
          </button>
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { ReferencesPanel };
