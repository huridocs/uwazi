import React, { useMemo } from 'react';
import RenderIfVisible from 'react-render-if-visible';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Pill, Table } from 'app/V2/Components/UI';
import { FormInput } from 'app/V2/Components/Forms';

type translationsTableType = {
  tablesData: any[];
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const languagePill = ({ cell }: CellContext<any, any>) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.getValue().status === 'defaultLanguage') color = 'primary';
  if (cell.getValue().status === 'untranslated') color = 'yellow';

  return <Pill color={color}>{cell.getValue().languageKey.toUpperCase()}</Pill>;
};

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

  const columns = [
    { header: <Translate>Language</Translate>, accessor: 'language', enabledSorting: false },
    {
      header: <Translate className="sr-only">Language Code</Translate>,
      accessor: 'translationStatus',
      cell: languagePill,
      enableSorting: false,
    },
    {
      header: <Translate>Value</Translate>,
      accessor: 'fieldKey',
      cell: memoizedInput,
      enableSorting: false,
      className: 'w-full',
    },
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
export { TranslationsTables };
