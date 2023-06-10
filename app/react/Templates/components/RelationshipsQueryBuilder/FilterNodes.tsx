/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import React, { ChangeEvent, useEffect } from 'react';
import { MultiSelect } from 'app/Forms';
import { ClientTemplateSchema, IStore } from 'app/istore';
import { connect } from 'react-redux';
import {
  Filter,
  TemplateFilter,
  SelectFilter,
  AndFilter,
} from 'shared/types/api.v2/templates.createTemplateRequest';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from 'shared/types/commonTypes';
import { FilterNode, AddFilterButton } from './BaseNodes';

interface TemplateFilterNodeComponentProps {
  value: TemplateFilter;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  onChange: (value: TemplateFilter) => void;
  onDelete: () => void;
  templates: ClientTemplateSchema[];
  path: string;
}

const TemplateFilterNodeComponent = ({
  value,
  isFirst,
  isLast,
  isRoot,
  onChange,
  onDelete,
  templates,
  path,
}: TemplateFilterNodeComponentProps) => {
  const onTemplatesChangeHandler = (newTemplates: string[]) =>
    onChange({ ...value, value: newTemplates });

  return (
    <FilterNode
      caption="Templates"
      isFirst={isFirst}
      isLast={isLast}
      nested={[]}
      onAddElementHandler={() => {}}
      onDeleteElementHandler={onDelete}
      canAdd={false}
      canDelete
      isRoot={isRoot}
    >
      <MultiSelect
        prefix={path}
        onChange={onTemplatesChangeHandler}
        options={templates}
        value={value.value}
        optionsValue="_id"
        optionsLabel="name"
      />
    </FilterNode>
  );
};

const TemplateFilterNode = connect((state: IStore) => ({
  templates: state.templates.toJS(),
}))(TemplateFilterNodeComponent);

interface SelectFilterNodeComponentProps {
  value: SelectFilter;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  onChange: (value: SelectFilter) => void;
  onDelete: () => void;
  thesauri: ThesaurusSchema[];
  selectProperties: PropertySchema[];
  path: string;
}

const SelectFilterNodeComponent = ({
  value,
  isFirst,
  isLast,
  isRoot,
  onChange,
  onDelete,
  thesauri,
  selectProperties,
  path,
}: SelectFilterNodeComponentProps) => {
  useEffect(() => {
    if (value.property === '') {
      onChange({ ...value, property: selectProperties[0].name, value: [] });
    }
  });

  const onPropertyChangeHandler = (event: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, property: event.target.value, value: [] });

  const onThesaurusChangeHandler = (newThesauri: string[]) =>
    onChange({ ...value, value: newThesauri });

  const getOptions = () => {
    const selectedProperty = selectProperties.find(p => p.name === value.property);
    return thesauri.find(thesaurus => thesaurus._id === selectedProperty?.content)?.values || [];
  };

  return (
    <FilterNode
      caption="Metadata: select"
      isFirst={isFirst}
      isLast={isLast}
      nested={[]}
      onAddElementHandler={() => {}}
      onDeleteElementHandler={onDelete}
      canAdd={false}
      canDelete
      isRoot={isRoot}
    >
      <span>Property:</span>
      <select onChange={onPropertyChangeHandler} style={{ marginBottom: '5px' }}>
        {selectProperties.map(property => (
          <option value={property.name}>{property.label}</option>
        ))}
      </select>
      <span>Values:</span>
      <MultiSelect
        prefix={path}
        onChange={onThesaurusChangeHandler}
        options={getOptions()}
        value={value.value}
        optionsValue="id"
        optionsLabel="label"
      />
    </FilterNode>
  );
};

const SelectFilterNode = connect((state: IStore) => ({
  selectProperties: state.templates
    .toJS()
    .flatMap((t: ClientTemplateSchema) => t.properties)
    .filter(
      (property: PropertySchema, index: number, all: PropertySchema[]) =>
        ['select', 'multiselect'].includes(property.type) &&
        all.findIndex((p: PropertySchema) => p.name === property.name) === index
    ),
  thesauri: state.thesauris.toJS(),
}))(SelectFilterNodeComponent);

interface AndFilterNodeProps {
  value: AndFilter;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  onChange: (value: AndFilter) => void;
  onDelete: () => void;
  path: string;
}

const AndFilterNode = ({
  value,
  isFirst,
  isLast,
  isRoot,
  onChange,
  onDelete,
  path,
}: AndFilterNodeProps) => {
  const createOnChildChangeHandler = (index: number) => (newFilterValue: Filter) => {
    const filters = [...(value.value ?? [])];
    filters[index] = newFilterValue;
    onChange({ ...value, value: filters });
  };

  const createOnDeleteChildHandler = (index: number, total: number) => () => {
    if (total > 1) {
      onChange({ ...value, value: value.value?.filter((_m, i) => i !== index) });
    } else {
      const filters = [...(value.value ?? [])];
      filters[index] = { type: 'void' };
      onChange({ ...value, value: filters });
    }
  };

  const onAddElementHandler = (newFilter: Filter) => {
    onChange({ ...value, value: [...value.value, newFilter] });
  };

  return (
    <FilterNode
      caption="AND"
      isFirst={isFirst}
      isLast={isLast}
      nested={value.value.map((filter, index) => (
        <AbstractFilter
          value={filter}
          onChange={createOnChildChangeHandler(index)}
          onDelete={createOnDeleteChildHandler(index, value.value.length)}
          path={`${path}.${index}`}
          isFirst={index === 0}
          isLast={value.value.length === 1 && filter.type === 'void'}
        />
      ))}
      onAddElementHandler={onAddElementHandler}
      onDeleteElementHandler={onDelete}
      canAdd={value.value.length > 0 && value.value[0].type !== 'void'}
      canDelete
      isRoot={isRoot}
    />
  );
};

interface VoidFilterNodeProps {
  onChange: (value: Filter) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
}

const VoidFilterNode = ({ onChange, isFirst, isLast, isRoot }: VoidFilterNodeProps) => (
  <FilterNode
    isFirst={isFirst}
    isLast={isLast}
    nested={[]}
    onAddElementHandler={() => {}}
    onDeleteElementHandler={() => {}}
    canAdd={false}
    canDelete={false}
    isRoot={isRoot}
  >
    <AddFilterButton onChange={newFilter => onChange(newFilter)} isRoot={isRoot} />
  </FilterNode>
);

interface FilterProps {
  value: Filter;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  onChange: (value: Filter) => void;
  onDelete: () => void;
  path: string;
}

export const AbstractFilter = ({
  value,
  isFirst,
  isLast,
  onChange,
  onDelete,
  path,
  isRoot,
}: FilterProps) => {
  switch (value.type) {
    case 'template':
      return (
        <TemplateFilterNode
          value={value}
          isFirst={isFirst}
          isLast={isLast}
          onChange={onChange}
          onDelete={onDelete}
          path={path}
          isRoot={isRoot}
        />
      );
    case 'select':
      return (
        <SelectFilterNode
          value={value}
          isFirst={isFirst}
          isLast={isLast}
          onChange={onChange}
          onDelete={onDelete}
          path={path}
          isRoot={isRoot}
        />
      );
    case 'and':
      return (
        <AndFilterNode
          value={value}
          isFirst={isFirst}
          isLast={isLast}
          onChange={onChange}
          onDelete={onDelete}
          path={path}
          isRoot={isRoot}
        />
      );
    case 'void':
      return (
        <VoidFilterNode onChange={onChange} isFirst={isFirst} isLast={isLast} isRoot={isRoot} />
      );
    default:
      return <>Invalid filter type</>;
  }
};
