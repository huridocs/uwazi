import React from 'react';
import RenderIfVisible from 'react-render-if-visible';
import { UseFormGetFieldState, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Table } from '../UI';
import { FormInput } from './FormInput';
import { LanguagePill } from './LanguagePill';

type translationsTableType = {
  tablesData: any[];
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  getFieldState: UseFormGetFieldState<any>;
  submitting: boolean;
};

const TranslationsTable = ({
  tablesData,
  register,
  setValue,
  getFieldState,
  submitting,
}: translationsTableType) => {
  const columns = [
    { key: '1', Header: 'Language', accessor: 'language', disableSortBy: true },
    {
      key: '2',
      Header: '',
      accessor: 'translationStatus',
      Cell: LanguagePill,
      disableSortBy: true,
    },
    {
      key: '3',
      Header: 'Current Value',
      accessor: 'fieldKey',
      Cell: (data: any) => FormInput(data, { register, setValue, getFieldState, submitting }),
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

export { TranslationsTable };
