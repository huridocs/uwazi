import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { useLoaderData, LoaderFunction } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import * as translationsAPI from 'V2/api/translations/index';
import {
  ContextPill,
  RenderButton,
  LabelHeader,
  TypeHeader,
  ActionHeader,
} from './components/TableComponents';

type TranslationContext = ClientTranslationContextSchema & { rowId: string };

const columnHelper = createColumnHelper<TranslationContext>();

const translationsListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    translationsAPI.get(headers);

const TranslationsList = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];

  const contexts: {
    systemContexts: TranslationContext[];
    contentContexts: TranslationContext[];
  } = { systemContexts: [], contentContexts: [] };

  translations[0]?.contexts?.forEach(context => {
    const contextTranslations: TranslationContext = {
      ...context,
      rowId: context.id!,
    };

    if (!contextTranslations.values || Object.keys(contextTranslations.values).length === 0) {
      return undefined;
    }

    if (contextTranslations.type === 'Uwazi UI') {
      return contexts.systemContexts.push({ ...contextTranslations });
    }

    return contexts.contentContexts.push({ ...contextTranslations });
  });

  const columns = [
    columnHelper.accessor('label', {
      header: LabelHeader,
      meta: { headerClassName: 'w-1/3' },
    }),
    columnHelper.accessor('type', {
      header: TypeHeader,
      cell: ContextPill,
      meta: { headerClassName: 'w-2/3' },
    }),
    columnHelper.accessor('id', {
      header: ActionHeader,
      cell: RenderButton,
      enableSorting: false,
    }),
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
            <Table
              columns={columns}
              data={contexts.systemContexts}
              header={
                <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                  System translations
                </Translate>
              }
              defaultSorting={[{ id: 'label', desc: false }]}
            />
          </div>
          <div className="mt-4" data-testid="content">
            <Table
              columns={columns}
              data={contexts.contentContexts}
              header={
                <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                  Content translations
                </Translate>
              }
              defaultSorting={[{ id: 'label', desc: false }]}
            />
          </div>
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export type { TranslationContext };
export { TranslationsList, translationsListLoader };
