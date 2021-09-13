import React, { useCallback, useMemo } from 'react';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { Aggregations } from 'shared/types/aggregations';
import { NeedAuthorization } from 'app/Auth';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { Control } from 'react-redux-form';
import { Switcher } from 'app/ReactReduxForms';
import { FiltrableLevel } from './FiltrablePermissionsLevels';

interface PermissionsValue {
  level: FiltrableLevel;
  refId: string;
}

interface AssigneeFilterProps {
  onChange: (values: PermissionsValue[]) => void;
  aggregations: Aggregations;
}

const generateOptions = (aggregations: Aggregations, level: FiltrableLevel) =>
  aggregations?.all?.[`_permissions.${level}`]?.buckets
    .filter(aggregation => aggregation.key !== 'any')
    .map(aggregation => ({
      label: aggregation.label!,
      title: aggregation.label!,
      value: aggregation.key,
      results: aggregation.filtered.doc_count,
      ...(aggregation.icon ? { icon: { type: 'Icons', _id: aggregation.icon } } : {}),
    })) || [];

export const AssigneeFilterSelectUncontrolled = ({
  onChange,
  aggregations,
  value = [],
}: AssigneeFilterProps & { value: PermissionsValue[] }) => {
  const readOptions = useMemo(() => generateOptions(aggregations, 'read'), [aggregations]);
  const writeOptions = useMemo(() => generateOptions(aggregations, 'write'), [aggregations]);

  const getChangeHandler = (level: FiltrableLevel) => (values: string[]) => {
    const newSelected = value
      .filter((v: PermissionsValue) => v.level !== level)
      .concat(values.map(v => ({ refId: v, level })));

    onChange(newSelected);
  };

  const onReadChangeHandler = useCallback(getChangeHandler('read'), [value, onChange]);
  const onWriteChangeHandler = useCallback(getChangeHandler('write'), [value, onChange]);

  const readValues = value.filter(v => v.level === 'read').map(v => v.refId);
  const writeValues = value.filter(v => v.level === 'write').map(v => v.refId);

  return (
    <>
      <li>
        <Translate>Shared as viewer</Translate>
      </li>
      <li className="wide">
        <MultiSelect
          prefix="permissions.read"
          onChange={onReadChangeHandler}
          options={readOptions}
          value={readValues}
        />
      </li>
      <li className="spaced">
        <Translate>Shared as editor</Translate>
      </li>
      <li className="wide">
        <MultiSelect
          prefix="permissions.write"
          onChange={onWriteChangeHandler}
          options={writeOptions}
          value={writeValues}
        />
      </li>
    </>
  );
};

// eslint-disable-next-line react/no-multi-comp
const AssigneeFilterSelect = ({
  model,
  prefix,
  onChange,
  aggregations,
}: AssigneeFilterProps & { model: string; prefix: string }) => (
  // eslint-disable-next-line react/jsx-pascal-case
  <Control.select
    component={AssigneeFilterSelectUncontrolled}
    model={model}
    prefix={prefix}
    onChange={onChange as any}
    // @ts-ignore
    aggregations={aggregations}
  />
);

// eslint-disable-next-line react/no-multi-comp
export const AssigneeFilter = ({ onChange, aggregations }: AssigneeFilterProps) => (
  <NeedAuthorization>
    <FormGroup key="permissions" className="admin-filter">
      <ul className="search__filter is-active">
        <li>
          <Translate>Permissions</Translate>
          <Switcher
            model={".customFilters['permissions'].and"}
            prefix="permissions"
            onChange={onChange}
          />
        </li>
        <AssigneeFilterSelect
          model=".customFilters['permissions'].values"
          prefix="permissions"
          onChange={onChange}
          aggregations={aggregations}
        />
      </ul>
    </FormGroup>
  </NeedAuthorization>
);
