import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ActionFunction, LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Row } from '@tanstack/react-table';
import * as extractorsAPI from 'app/V2/api/ix/extractors';
import * as suggestionsAPI from 'app/V2/api/ix/suggestions';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { suggestionsTableColumnsBuilder } from './components/TableElements';
import { Button, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { IXExtractorInfo } from 'app/V2/shared/types';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { ClientTemplateSchema } from 'app/istore';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'app/V2/atoms';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { FiltersSidepanel } from './components/FiltersSidepanel';

const IXSuggestions = () => {
  const { suggestions, extractor, templates, aggregation } = useLoaderData() as {
    suggestions: EntitySuggestionType[];
    extractor: IXExtractorInfo;
    templates: ClientTemplateSchema[];
    aggregation: any;
  };
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [selected, setSelected] = useState<Row<EntitySuggestionType>[]>([]);
  const revalidator = useRevalidator();
  const setNotifications = useSetRecoilState(notificationAtom);

  const filteredTemplates = () =>
    templates ? templates.filter(template => extractor.templates.includes(template._id)) : [];

  const acceptSuggestionAction = async (suggestion: EntitySuggestionType) => {
    try {
      await suggestionsAPI.accept({
        _id: suggestion._id as ObjectIdSchema,
        sharedId: suggestion.sharedId,
        entityId: suggestion.entityId,
      });
      revalidator.revalidate();
      setNotifications({
        type: 'success',
        text: <Translate>Suggestion accepted.</Translate>,
      });
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.json?.prettyMessage ? error.json.prettyMessage : undefined,
      });
    }
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={
            <>
              <Translate>Metadata extraction</Translate> <ChevronRightIcon className="w-4 mx-2" />{' '}
              {extractor.name}
            </>
          }
        />

        <SettingsContent.Body>
          <Table<EntitySuggestionType>
            data={suggestions}
            columns={suggestionsTableColumnsBuilder(filteredTemplates(), acceptSuggestionAction)}
            title={
              <SuggestionsTitle
                propertyName={extractor.property}
                templates={filteredTemplates()}
                onFiltersButtonClicked={() => {
                  setShowSidepanel(true);
                }}
              ></SuggestionsTitle>
            }
            enableSelection
            onSelection={setSelected}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer
          className={`flex gap-2 ${Boolean(selected.length) ? 'bg-gray-200' : ''}`}
        >
          {Boolean(selected.length) ? (
            <div className="flex items-center justify-center space-x-4">
              <Button size="small" type="button" styling="outline" onClick={() => {}}>
                <Translate>Accept suggestion</Translate>
              </Button>
              <div className="text-sm font-semibold text-center text-gray-900">
                <span className="font-light text-gray-500">Selected</span> {selected.length}{' '}
                <span className="font-light text-gray-500">of</span> 20
              </div>
            </div>
          ) : (
            <Button size="small" type="button" onClick={() => {}}>
              <Translate>Find suggestions</Translate>
            </Button>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <FiltersSidepanel
        showSidepanel={showSidepanel}
        setShowSidepanel={setShowSidepanel}
        aggregation={aggregation}
      />
    </div>
  );
};

const IXSuggestionsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId } }) => {
    const response = await suggestionsAPI.get(
      { filter: { extractorId: extractorId! }, page: { number: 1, size: 20 } },
      headers
    );
    const extractors = await extractorsAPI.getById(extractorId!, headers);
    const aggregation = await suggestionsAPI.aggregation({
      filter: { extractorId: extractorId! },
    });
    const templates = await templatesAPI.get(headers);

    return {
      suggestions: response.suggestions,
      extractor: extractors[0],
      templates,
      aggregation: aggregation,
    };
  };

const IXSuggestionsAction =
  (): ActionFunction =>
  async ({ request, params: { extractorId } }) => {
    const formData = await request.formData();
    const formValues = JSON.parse(formData.get('data') as string);

    return suggestionsAPI.get({
      page: { number: 1, size: 20 },
      filter: { extractorId: extractorId!, customFilter: formValues },
    });
  };

export { IXSuggestions, IXSuggestionsLoader, IXSuggestionsAction };
