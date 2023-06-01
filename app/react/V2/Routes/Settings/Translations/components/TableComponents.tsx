/* eslint-disable react/no-multi-comp */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { createColumnHelper } from '@tanstack/react-table';
import RenderIfVisible from 'react-render-if-visible';
import { Translate } from 'app/I18N';
import { Button, Pill, Table } from 'V2/Components/UI';
import { FormInput } from 'V2/Components/Forms';

type translationsTableType = {
  tablesData: any[];
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const RenderButton = ({ cell }) => (
  <Link to={`edit/${cell.row.original.id}`}>
    <Button styling="outline" className="leading-4">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const ContextPill = ({ cell }) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.renderValue()}</Translate>
    </Pill>
  </div>
);

const LanguagePill = ({ cell }) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.getValue().status === 'defaultLanguage') color = 'primary';
  if (cell.getValue().status === 'untranslated') color = 'yellow';

  return <Pill color={color}>{cell.getValue().languageKey.toUpperCase()}</Pill>;
};

const LanguageHeader = () => <Translate>Language</Translate>;
const StatusHeader = () => <Translate className="sr-only">Language Code</Translate>;
const FieldKeyHeader = () => <Translate>Value</Translate>;

const TranslationsTables = ({
  tablesData,
  register,
  setValue,
  submitting,
  getFieldState,
}: translationsTableType) => {
  const memoizedInput = useMemo(
    () => (data: any) => FormInput(data, { register, setValue, submitting, getFieldState }),
    [getFieldState, register, setValue, submitting]
  );

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('language', {
      header: LanguageHeader,
      enabledSorting: false,
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
      className: 'w-full',
    }),
  ];

  return (
    <>
      {tablesData.map(data => {
        const [contextTerm] = Object.keys(data);
        return (
          <div key={contextTerm} className="mt-4">
            <RenderIfVisible stayRendered>
              <Table columns={columns} data={data[contextTerm]} title={contextTerm} />
            </RenderIfVisible>
          </div>
        );
      })}
    </>
  );
};

export { RenderButton, ContextPill, TranslationsTables };
