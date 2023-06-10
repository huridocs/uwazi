/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import { MultiSelect } from 'app/Forms';
import { IStore, RelationshipTypesType } from 'app/istore';
import React from 'react';
import { connect } from 'react-redux';
import {
  Filter,
  MatchQuery,
  TraverseQuery,
} from 'shared/types/api.v2/templates.createTemplateRequest';
import { boxStyles, nodeContainerStyles, nodeStyles, childrenStyles } from './styles';
import { Edges, Node, AddElement } from './BaseNodes';
import { AbstractFilter } from './FilterNodes';

const createDefaultTraversal = () =>
  ({
    direction: 'out',
    types: [],
    match: [
      {
        filter: { type: 'void' },
      },
    ],
  } as TraverseQuery);

interface MatchNodeProps {
  value: MatchQuery;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (value: MatchQuery) => void;
  onDelete: () => void;
  path: string;
  canDelete?: boolean;
}

const MatchNode = ({
  value,
  isFirst,
  isLast,
  onChange,
  onDelete,
  path,
  canDelete,
}: MatchNodeProps) => {
  const createOnChildChangeHandler = (index: number) => (newTraverseValue: TraverseQuery) => {
    const traverses = [...(value.traverse ?? [])];
    traverses[index] = newTraverseValue;
    onChange({ ...value, traverse: traverses });
  };

  const createOnDeleteChildHandler = (index: number) => () => {
    onChange({ ...value, traverse: value.traverse?.filter((_m, i) => i !== index) });
  };

  const onFilterChangeHandler = (filter: Filter) => onChange({ ...value, filter });

  const onDeleteFilterHandler = () => {
    onChange({ ...value, filter: { type: 'void' } });
  };

  const onAddElementHandler = () =>
    onChange({
      ...value,
      traverse: [...(value.traverse ?? []), createDefaultTraversal()],
    });

  return (
    <Node
      caption="Match entities"
      isFirst={isFirst}
      isLast={isLast}
      nested={
        value.traverse?.map((traversal, index) => (
          <TravesalNode
            key={index}
            value={traversal}
            isFirst={index === 0}
            onChange={createOnChildChangeHandler(index)}
            onDelete={createOnDeleteChildHandler(index)}
            path={`${path}.${index}`}
          />
        )) || []
      }
      onAddElementHandler={onAddElementHandler}
      onDeleteElementHandler={onDelete}
      deleteDisabled={!canDelete}
    >
      <span>Filter</span>
      <AbstractFilter
        isFirst
        isLast={false}
        value={value.filter}
        onChange={onFilterChangeHandler}
        onDelete={onDeleteFilterHandler}
        path={`${path}.filter.`}
        isRoot
      />
    </Node>
  );
};

interface TravesalNodeProps {
  value: TraverseQuery;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (value: TraverseQuery) => void;
  onDelete: () => void;
  relationTypes: RelationshipTypesType[];
  path: string;
}

const TravesalNodeComponent = ({
  value,
  isFirst,
  isLast,
  onChange,
  onDelete,
  relationTypes,
  path,
}: TravesalNodeProps) => {
  const createOnChildChangeHandler = (index: number) => (newMatchValue: MatchQuery) => {
    const matches = [...value.match];
    matches[index] = newMatchValue;
    onChange({ ...value, match: matches });
  };

  const createOnDeleteChildHandler = (index: number) => () => {
    onChange({ ...value, match: value.match.filter((_m, i) => i !== index) });
  };

  const onAddElementHandler = () =>
    onChange({
      ...value,
      match: [...(value.match ?? []), createDefaultTraversal().match[0]],
    });

  const onDirectionChangeHandler = (event: { target: { value: string } }) =>
    onChange({ ...value, direction: event.target.value as 'in' | 'out' });

  const onTypesChangeHandler = (types: string[]) => onChange({ ...value, types });

  return (
    <Node
      caption="Traverse relationships"
      isFirst={isFirst}
      isLast={isLast}
      nested={value.match.map((match, index) => (
        <MatchNode
          key={index}
          value={match}
          isFirst={index === 0}
          onChange={createOnChildChangeHandler(index)}
          onDelete={createOnDeleteChildHandler(index)}
          path={`${path}.${index}`}
          canDelete={value.match.length > 1}
        />
      ))}
      onAddElementHandler={onAddElementHandler}
      onDeleteElementHandler={onDelete}
    >
      <select value={value.direction} onChange={onDirectionChangeHandler}>
        <option value="out">{'-- out -->'}</option>
        <option value="in">{'<-- in --'}</option>
      </select>
      <MultiSelect
        prefix={path}
        onChange={onTypesChangeHandler}
        options={relationTypes}
        value={value.types}
        optionsValue="_id"
        optionsLabel="name"
      />
    </Node>
  );
};

const TravesalNode = connect((state: IStore) => ({
  relationTypes: state.relationTypes.toJS(),
}))(TravesalNodeComponent);

interface RelationshipsQueryBuilderProps {
  value: TraverseQuery[];
  onChange: (value: TraverseQuery[]) => void;
}

export const RelationshipsQueryBuilder = ({ value, onChange }: RelationshipsQueryBuilderProps) => {
  const createOnChildChangeHandler = (index: number) => (newTraverseValue: TraverseQuery) => {
    const traverses = [...(value ?? [])];
    traverses[index] = newTraverseValue;
    onChange(traverses);
  };

  const createOnDeleteChildHandler = (index: number) => () => {
    onChange((value ?? []).filter((_m, i) => i !== index));
  };

  const onAddElementHandler = () => onChange([...(value ?? []), createDefaultTraversal()]);

  return (
    <div className="form-control" style={{ ...boxStyles, height: 'unset', overflowX: 'scroll' }}>
      <div style={nodeContainerStyles}>
        <div
          style={{
            ...nodeStyles,
            width: '50px',
            height: '50px',
            borderRadius: '50px',
            marginTop: 0,
          }}
        />
      </div>
      {value?.length ? <Edges isRight /> : null}
      <div style={childrenStyles}>
        {value?.map((traversal, index) => (
          <TravesalNode
            key={index}
            value={traversal}
            isFirst={index === 0}
            onChange={createOnChildChangeHandler(index)}
            onDelete={createOnDeleteChildHandler(index)}
            path={`${index}`}
          />
        ))}
        <AddElement isFirst={!value?.length} onClick={onAddElementHandler} />
      </div>
    </div>
  );
};
