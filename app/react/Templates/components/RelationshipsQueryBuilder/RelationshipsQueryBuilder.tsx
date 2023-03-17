/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import { MultiSelect } from 'app/Forms';
import { ClientTemplateSchema, IStore, RelationshipTypesType } from 'app/istore';
import React from 'react';
import { connect } from 'react-redux';
import {
  MatchQueryInputType,
  TraverseInputType,
  TraverseQueryInputType,
} from 'shared/types/relationshipsQueryTypes';

const boxStyles = {
  display: 'flex',
  'flex-direction': 'row',
  'align-items': 'stretch',
};

const nodeContainerStyles = {
  display: 'flex',
  'align-items': 'center',
};

const upEdgeStyles = {
  width: '10px',
  'border-bottom': 'solid 1px black',
  'border-left': 'solid 2px black',
  'flex-grow': '1',
};

const upEdgeStylesNone = {
  width: '10px',
  'border-bottom': 'solid 1px black',
  'flex-grow': '1',
};

const downEdgeStylesNone = {
  width: '10px',
  'border-top': 'solid 1px black',
  'flex-grow': '1',
};

const downEdgeStyles = {
  width: '10px',
  'border-top': 'solid 1px black',
  'border-left': 'solid 2px black',
  'flex-grow': '1',
};

const upEdgeStylesRight = {
  width: '10px',
  'border-bottom': 'solid 1px black',
  'flex-grow': '1',
};

const downEdgeStylesRight = {
  width: '10px',
  'border-top': 'solid 1px black',
  'flex-grow': '1',
};

const verticalEdgeStyles = {
  display: 'flex',
  'flex-direction': 'column',
};

const nodeStyles = {
  border: 'solid 1px black',
  padding: '3px',
  'margin-top': '6px',
  display: 'flex',
  'flex-direction': 'column',
};

const childrenStyles = {
  display: 'flex',
  'flex-direction': 'column',
  'justify-content': 'center',
};

interface EdgesProps {
  isFirst?: boolean;
  isLast?: boolean;
}

const Edges = ({ isFirst, isLast }: EdgesProps) => {
  if (isFirst && isLast) {
    return (
      <div style={verticalEdgeStyles}>
        <div style={upEdgeStylesNone} />
        <div style={downEdgeStylesNone} />
      </div>
    );
  }

  return (
    <div style={verticalEdgeStyles}>
      {isFirst ? <div style={upEdgeStylesNone} /> : <div style={upEdgeStyles} />}
      {isLast ? <div style={downEdgeStylesNone} /> : <div style={downEdgeStyles} />}
    </div>
  );
};

interface AddElementProps {
  isFirst: boolean;
  onClick: () => void;
}

const AddElement = ({ isFirst, onClick }: AddElementProps) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast />
    <div style={nodeContainerStyles}>
      <div style={{ ...nodeStyles, border: 'none' }}>
        <input type="button" value="+" onClick={onClick} />
      </div>
    </div>
  </div>
);
interface NodeProps {
  isFirst?: boolean;
  isLast?: boolean;
  children: JSX.Element;
  nested: JSX.Element[];
  onAddElementHandler: () => void;
}

const Node = ({ isFirst, isLast, nested, children, onAddElementHandler }: NodeProps) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast={isLast} />
    <div style={nodeContainerStyles}>{children}</div>
    {nested.length ? (
      <div style={verticalEdgeStyles}>
        <div style={upEdgeStylesRight} />
        <div style={downEdgeStylesRight} />
      </div>
    ) : null}
    <div style={childrenStyles}>
      {nested}
      <AddElement isFirst={nested.length === 0} onClick={onAddElementHandler} />
    </div>
  </div>
);

interface MatchNodeProps {
  value: MatchQueryInputType;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (value: MatchQueryInputType) => void;
  templates: ClientTemplateSchema[];
  path: string;
}

const MatchNodeComponent = ({
  value,
  isFirst,
  isLast,
  onChange,
  templates,
  path,
}: MatchNodeProps) => {
  const createOnChildChangeHandler =
    (index: number) => (newTraverseValue: TraverseQueryInputType) => {
      const traverses = [...(value.traverse ?? [])];
      traverses[index] = newTraverseValue;
      onChange({ ...value, traverse: traverses });
    };

  const onTemplatesChangeHandler = (newTemplates: string[]) =>
    onChange({ ...value, templates: newTemplates });

  const onAddElementHandler = () =>
    onChange({
      ...value,
      traverse: [
        ...(value.traverse ?? []),
        {
          direction: 'out',
          types: [],
          match: [],
        },
      ],
    });

  return (
    <Node
      isFirst={isFirst}
      isLast={isLast}
      nested={
        value.traverse?.map((traversal, index) => (
          <TravesalNode
            key={index}
            value={traversal}
            isFirst={index === 0}
            onChange={createOnChildChangeHandler(index)}
            path={`${path}.${index}`}
          />
        )) || []
      }
      onAddElementHandler={onAddElementHandler}
    >
      <div style={{ ...nodeStyles, borderRadius: '3px' }}>
        <MultiSelect
          prefix={path}
          onChange={onTemplatesChangeHandler}
          options={templates}
          value={value.templates}
          optionsValue="_id"
          optionsLabel="name"
        />
      </div>
    </Node>
  );
};

const MatchNode = connect((state: IStore) => ({
  templates: state.templates.toJS(),
}))(MatchNodeComponent);

interface TravesalNodeProps {
  value: TraverseQueryInputType;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (value: TraverseQueryInputType) => void;
  relationTypes: RelationshipTypesType[];
  path: string;
}

const TravesalNodeComponent = ({
  value,
  isFirst,
  isLast,
  onChange,
  relationTypes,
  path,
}: TravesalNodeProps) => {
  const createOnChildChangeHandler = (index: number) => (newMatchValue: MatchQueryInputType) => {
    const matches = [...value.match];
    matches[index] = newMatchValue;
    onChange({ ...value, match: matches });
  };

  const onAddElementHandler = () =>
    onChange({
      ...value,
      match: [
        ...(value.match ?? []),
        {
          templates: [],
          traverse: [],
        },
      ],
    });

  const onDirectionChangeHandler = (event: { target: { value: string } }) =>
    onChange({ ...value, direction: event.target.value as 'in' | 'out' });

  const onTypesChangeHandler = (types: string[]) => onChange({ ...value, types });

  return (
    <Node
      isFirst={isFirst}
      isLast={isLast}
      nested={value.match.map((match, index) => (
        <MatchNode
          key={index}
          value={match}
          isFirst={index === 0}
          onChange={createOnChildChangeHandler(index)}
          path={`${path}.${index}`}
        />
      ))}
      onAddElementHandler={onAddElementHandler}
    >
      <div style={nodeStyles}>
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
      </div>
    </Node>
  );
};

const TravesalNode = connect((state: IStore) => ({
  relationTypes: state.relationTypes.toJS(),
}))(TravesalNodeComponent);

interface RelationshipsQueryBuilderProps {
  value: TraverseInputType;
  onChange: (value: TraverseInputType) => void;
}

export const RelationshipsQueryBuilder = ({ value, onChange }: RelationshipsQueryBuilderProps) => {
  const createOnChildChangeHandler =
    (index: number) => (newTraverseValue: TraverseQueryInputType) => {
      const traverses = [...(value ?? [])];
      traverses[index] = newTraverseValue;
      onChange(traverses);
    };

  const onAddElementHandler = () =>
    onChange([...(value ?? []), { direction: 'out', types: [], match: [] }]);

  return (
    <div className="form-control" style={{ ...boxStyles, height: 'unset', overflowX: 'scroll' }}>
      <div style={nodeContainerStyles}>
        <div style={{ ...nodeStyles, width: '50px', height: '50px', borderRadius: '50px' }} />
      </div>
      {value?.length ? (
        <div style={verticalEdgeStyles}>
          <div style={upEdgeStylesRight} />
          <div style={downEdgeStylesRight} />
        </div>
      ) : null}
      <div style={childrenStyles}>
        {value?.map((traversal, index) => (
          <TravesalNode
            key={index}
            value={traversal}
            isFirst={index === 0}
            onChange={createOnChildChangeHandler(index)}
            path={`${index}`}
          />
        ))}
        <AddElement isFirst={!value?.length} onClick={onAddElementHandler} />
      </div>
    </div>
  );
};
