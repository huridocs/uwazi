import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import * as translationsAPI from 'V2/api/translations/index';
import { ContextPill, RenderButton, LabelHeader, TypeHeader } from './components/TableComponents';

const translationsListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    translationsAPI.get(headers);

const TranslationsList = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];

  const contexts: {
    systemContexts: ClientTranslationContextSchema[];
    contentContexts: ClientTranslationContextSchema[];
  } = { systemContexts: [], contentContexts: [] };

  translations[0]?.contexts?.forEach(context => {
    const contextTranslations = { ...context };

    if (!contextTranslations.values || Object.keys(contextTranslations.values).length === 0) {
      return undefined;
    }

    if (contextTranslations.type === 'Uwazi UI') {
      return contexts.systemContexts.push({ ...contextTranslations });
    }

    return contexts.contentContexts.push({ ...contextTranslations });
  });

  // Helper typed as any because of https://github.com/TanStack/table/issues/4224
  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor('label', {
      header: LabelHeader,
      meta: { headerClassName: 'w-1/3' },
    }) as ColumnDef<ClientTranslationContextSchema, 'label'>,
    columnHelper.accessor('type', {
      header: TypeHeader,
      cell: ContextPill,
      meta: { headerClassName: 'w-2/3' },
    }) as ColumnDef<ClientTranslationContextSchema, 'type'>,
    columnHelper.accessor('id', {
      header: '',
      cell: RenderButton,
      enableSorting: false,
      meta: { headerClassName: 'text-center w-0' },
    }) as ColumnDef<ClientTranslationContextSchema, 'id'>,
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-translations"
    >
      <SettingsContent>
        <SettingsContent.Header title="Translations" />
        <SettingsContent.Body>
          <div data-testid="translations">
            <Table<ClientTranslationContextSchema>
              columns={columns}
              data={contexts.systemContexts}
              title={<Translate>System translations</Translate>}
              initialState={{ sorting: [{ id: 'label', desc: false }] }}
            />
          </div>
          <div className="mt-4" data-testid="content">
            <Table<ClientTranslationContextSchema>
              columns={columns}
              data={contexts.contentContexts}
              title={<Translate>Content translations</Translate>}
              initialState={{ sorting: [{ id: 'label', desc: false }] }}
            />
          </div>
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { TranslationsList, translationsListLoader };
