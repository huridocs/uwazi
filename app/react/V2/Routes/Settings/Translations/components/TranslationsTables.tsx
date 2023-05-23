import React, { useMemo } from 'react';
import RenderIfVisible from 'react-render-if-visible';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { Table } from 'app/V2/Components/UI';
import { FormInput } from 'app/V2/Components/Forms';
import { LanguagePill } from './LanguagePill';

type translationsTableType = {
  tablesData: any[];
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
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
    { Header: <Translate>Language</Translate>, accessor: 'language', disableSortBy: true },
    {
      Header: <Translate className="sr-only">Language Code</Translate>,
      accessor: 'translationStatus',
      Cell: LanguagePill,
      disableSortBy: true,
    },
    {
      Header: <Translate>Value</Translate>,
      accessor: 'fieldKey',
      Cell: memoizedInput,
      disableSortBy: true,
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
