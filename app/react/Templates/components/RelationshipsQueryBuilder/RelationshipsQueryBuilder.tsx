/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import { MultiSelect } from 'app/Forms';
import { ClientTemplateSchema, IStore, RelationshipTypesType } from 'app/istore';
import React from 'react';
import { connect } from 'react-redux';
import { MatchQuery, TraverseQuery } from 'shared/types/api.v2/templates.createTemplateRequest';

const edgeStylesBase = {
  styles: {
    width: '10px',
    flexGrow: '1',
  },
  lineWidth: 1,
  getLineStyle: (multiplier: number) => `solid ${multiplier * edgeStylesBase.lineWidth}px black`,
};

const edgeStyles = {
  noVertical: {
    top: {
      ...edgeStylesBase.styles,
      borderBottom: edgeStylesBase.getLineStyle(1),
    },
    bottom: {
      ...edgeStylesBase.styles,
      borderTop: edgeStylesBase.getLineStyle(1),
    },
  },
  withVertical: {
    left: {
      top: {
        ...edgeStylesBase.styles,
        borderBottom: edgeStylesBase.getLineStyle(1),
        borderLeft: edgeStylesBase.getLineStyle(2),
      },
      bottom: {
        ...edgeStylesBase.styles,
        borderTop: edgeStylesBase.getLineStyle(1),
        borderLeft: edgeStylesBase.getLineStyle(2),
      },
    },
  },
};

const edgeContainerStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
};

const boxStyles = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'stretch',
};

const nodeContainerStyles = {
  display: 'flex',
  alignItems: 'center',
};

const nodeStyles = {
  border: 'solid 1px black',
  borderRadius: '3px',
  padding: '3px',
  marginTop: '3px',
  marginBottom: '3px',
  display: 'flex',
  flexDirection: 'column' as const,
};

const childrenStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
};

interface EdgesProps {
  isFirst?: boolean;
  isLast?: boolean;
  isRight?: boolean;
}

const Edges = ({ isFirst, isLast, isRight }: EdgesProps) => {
  if (isRight || (isFirst && isLast)) {
    return (
      <div style={edgeContainerStyles}>
        <div style={edgeStyles.noVertical.top} />
        <div style={edgeStyles.noVertical.bottom} />
      </div>
    );
  }

  return (
    <div style={edgeContainerStyles}>
      {isFirst ? (
        <div style={edgeStyles.noVertical.top} />
      ) : (
        <div style={edgeStyles.withVertical.left.top} />
      )}
      {isLast ? (
        <div style={edgeStyles.noVertical.bottom} />
      ) : (
        <div style={edgeStyles.withVertical.left.bottom} />
      )}
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
  caption: string;
  isFirst?: boolean;
  isLast?: boolean;
  children: JSX.Element | JSX.Element[];
  nested: JSX.Element[];
  onAddElementHandler: () => void;
  onDeleteElementHandler: () => void;
  deleteDisabled?: boolean;
}

const Node = ({
  caption,
  isFirst,
  isLast,
  nested,
  children,
  onAddElementHandler,
  onDeleteElementHandler,
  deleteDisabled,
}: NodeProps) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast={isLast} />
    <div style={nodeContainerStyles}>
      <div style={nodeStyles}>
        <div
          style={{
            float: 'left',
            borderBottom: 'solid 1px lightgrey',
            marginBottom: '5px',
            paddingBottom: '5px',
          }}
        >
          <span style={{ marginRight: '5px' }}>{caption}</span>
          <input
            type="button"
            value="x"
            onClick={onDeleteElementHandler}
            disabled={deleteDisabled}
          />
        </div>
        {children}
      </div>
    </div>
    {nested.length ? <Edges isRight /> : null}
    <div style={childrenStyles}>
      {nested}
      <AddElement isFirst={nested.length === 0} onClick={onAddElementHandler} />
    </div>
  </div>
);

const createDefaultTraversal = () =>
  ({
    direction: 'out',
    types: [],
    match: [
      {
        filter: { type: 'template', value: [] },
      },
    ],
  } as TraverseQuery);

interface MatchNodeProps {
  value: MatchQuery;
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (value: MatchQuery) => void;
  onDelete: () => void;
  templates: ClientTemplateSchema[];
  path: string;
  canDelete?: boolean;
}

const MatchNodeComponent = ({
  value,
  isFirst,
  isLast,
  onChange,
  onDelete,
  templates,
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

  const onTemplatesChangeHandler = (newTemplates: string[]) =>
    onChange({ ...value, filter: { type: 'template', value: newTemplates } });

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
      <MultiSelect
        prefix={path}
        onChange={onTemplatesChangeHandler}
        options={templates}
        value={value.filter.type === 'template' ? value.filter.value : []}
        optionsValue="_id"
        optionsLabel="name"
      />
    </Node>
  );
};

const MatchNode = connect((state: IStore) => ({
  templates: state.templates.toJS(),
}))(MatchNodeComponent);

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
      match: [
        ...(value.match ?? []),
        {
          filter: { type: 'template', value: [] },
          traverse: [],
        },
      ],
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
