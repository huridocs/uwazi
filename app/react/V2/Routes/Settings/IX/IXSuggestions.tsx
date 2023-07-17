import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { getSuggestions, getExtractorById } from 'app/V2/api/ix';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { suggestionsTableColumns } from './components/TableElements';
import { Button, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { IXExtractorInfo } from 'app/V2/shared/types';
import { SuggestionsTitle } from './components/SuggestionsTitle';
import { ClientTemplateSchema } from 'app/istore';

const IXSuggestions = () => {
  const { suggestions, extractor, templates } = useLoaderData() as {
    suggestions: EntitySuggestionType[];
    extractor: IXExtractorInfo;
    templates: ClientTemplateSchema[];
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction suggestions" />

        <SettingsContent.Body>
          <Table<EntitySuggestionType>
            data={suggestions}
            columns={suggestionsTableColumns}
            title={
              <SuggestionsTitle
                propertyName={extractor.property}
                templates={
                  templates
                    ? templates.filter(template => extractor.templates.includes(template._id))
                    : []
                }
              ></SuggestionsTitle>
            }
            enableSelection
            onSelection={() => {}}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2">
          <Button size="small" type="button" onClick={() => {}}>
            <Translate>Find suggestions</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

const IXSuggestionsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId } }) => {
    const response = await getSuggestions(
      { filter: { extractorId }, page: { number: 1, size: 20 } },
      headers
    );
    const extractors = await getExtractorById(extractorId!, headers);
    const templates = await templatesAPI.get(headers);

    return { suggestions: response.suggestions, extractor: extractors[0], templates };
  };
export { IXSuggestions, IXSuggestionsLoader };
