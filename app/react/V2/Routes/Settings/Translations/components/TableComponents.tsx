/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import RenderIfVisible from 'react-render-if-visible';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema } from 'app/istore';
import { Button, Pill, Table } from 'V2/Components/UI';
import { FormInput } from 'V2/Components/Forms';

type TableData = {
  language: string | undefined;
  translationStatus: {
    languageKey: string | undefined;
    status: string;
  };
  fieldKey: string;
};

type TranslationsTableType = {
  tablesData: ({ [contextTerm: string]: TableData[] } | undefined)[];
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const LanguageHeader = () => <Translate>Language</Translate>;
const StatusHeader = () => <Translate className="sr-only">Language Code</Translate>;
const FieldKeyHeader = () => <Translate>Value</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;
const LabelHeader = () => <Translate>Name</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;

const RenderButton = ({ cell }: CellContext<ClientTranslationContextSchema, any>) => (
  <Link to={`edit/${cell.row.original.id}`}>
    <Button styling="outline" className="leading-4">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const ContextPill = ({ cell }: CellContext<ClientTranslationContextSchema, any>) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.renderValue()}</Translate>
    </Pill>
  </div>
);

const LanguagePill = ({ cell }: CellContext<TableData, TableData['translationStatus']>) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.getValue().status === 'defaultLanguage') color = 'primary';
  if (cell.getValue().status === 'untranslated') color = 'yellow';

  return <Pill color={color}>{cell.getValue().languageKey?.toUpperCase()}</Pill>;
};

const TranslationsTables = ({
  tablesData,
  register,
  setValue,
  submitting,
  getFieldState,
}: TranslationsTableType) => {
  const memoizedInput = useMemo(
    () => (data: any) => FormInput(data, { register, setValue, submitting, getFieldState }),
    [getFieldState, register, setValue, submitting]
  );

  const columnHelper = createColumnHelper<TableData>();

  const columns = [
    columnHelper.accessor('language', {
      header: LanguageHeader,
      enableSorting: false,
    }),

    columnHelper.accessor('translationStatus', {
      header: StatusHeader,
      cell: LanguagePill,
      enableSorting: false,
    }),
    columnHelper.accessor('fieldKey', {
      header: FieldKeyHeader,
      cell: memoizedInput,
      enableSorting: false,
      meta: { className: 'w-full' },
    }),
  ];

  return (
    <>
      {tablesData.map(data => {
        if (data) {
          const [contextTerm] = Object.keys(data);
          return (
            <div key={contextTerm} className="mt-4">
              <RenderIfVisible stayRendered>
                <Table<TableData> columns={columns} data={data[contextTerm]} title={contextTerm} />
              </RenderIfVisible>
            </div>
          );
        }

        return undefined;
      })}
    </>
  );
};

export { RenderButton, ContextPill, TranslationsTables, ActionHeader, LabelHeader, TypeHeader };
