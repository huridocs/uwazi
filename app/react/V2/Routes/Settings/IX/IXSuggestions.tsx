import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { getSuggestions } from 'app/V2/api/ix';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { suggestionsTableColumns } from './components/TableElements';
import { Button, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';

const IXSuggestions = () => {
  const { suggestions } = useLoaderData() as {
    suggestions: EntitySuggestionType[];
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
            title={<Translate>Suggestions</Translate>}
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
    console.log(response.suggestions);
    return { suggestions: response.suggestions };
  };
export { IXSuggestions, IXSuggestionsLoader };
