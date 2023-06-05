/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import { MultiSelect } from 'app/Forms';
import { ClientTemplateSchema, IStore, RelationshipTypesType } from 'app/istore';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  AndFilter,
  Filter,
  MatchQuery,
  TemplateFilter,
  TraverseQuery,
} from 'shared/types/api.v2/templates.createTemplateRequest';

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
            paddingBottom: '9px',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
          <span style={{ marginRight: '27px', fontWeight: 'bold' }}>{caption}</span>
          <input
            type="button"
            value="x"
            onClick={onDeleteElementHandler}
            disabled={deleteDisabled}
            style={{ right: 0, position: 'absolute' }}
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

interface FilterNodeProps {
  caption?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  children?: null | JSX.Element | JSX.Element[];
  nested: JSX.Element[];
  canAdd: boolean;
  canDelete: boolean;
  onAddElementHandler: (newFilter: Filter) => void;
  onDeleteElementHandler: () => void;
}

const FilterNode = ({
  caption,
  isFirst,
  isLast,
  isRoot,
  nested,
  children,
  canAdd,
  canDelete,
  onAddElementHandler,
  onDeleteElementHandler,
}: FilterNodeProps) => (
  <div style={boxStyles}>
    {!isRoot ? <Edges isFirst={isFirst} isLast={isLast} /> : null}
    <div style={nodeContainerStyles}>
      <div style={nodeStyles}>
        {caption ? (
          <div
            style={{
              float: 'left',
              borderBottom: children ? 'solid 1px lightgrey' : undefined,
              marginBottom: '5px',
              paddingBottom: '9px',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            <span style={{ marginRight: '27px' }}>{caption}</span>
            {canDelete ? (
              <input
                type="button"
                value="x"
                onClick={onDeleteElementHandler}
                style={{ right: 0, position: 'absolute' }}
              />
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
    {nested.length ? <Edges isRight /> : null}
    <div style={childrenStyles}>
      {nested}
      {canAdd ? (
        <div style={boxStyles}>
          <Edges isFirst={false} isLast />
          <div style={nodeContainerStyles}>
            <div style={{ ...nodeStyles, border: 'none' }} />
            <AddFilterButton onChange={onAddElementHandler} isRoot={isRoot} />
          </div>
        </div>
      ) : null}
    </div>
  </div>
);

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
interface AddFilterButtonProps {
  onChange: (value: Filter) => void;
  isRoot?: boolean;
}

const AddFilterButton = ({ onChange, isRoot }: AddFilterButtonProps) => {
  const [show, setShow] = useState(false);
  return (
    <>
      {!show ? (
        <button
          type="button"
          onClick={() => {
            setShow(true);
          }}
        >
          {isRoot ? 'Add filter' : 'Add'}
        </button>
      ) : null}
      {show ? (
        <div>
          <button
            type="button"
            onClick={() => {
              onChange({ type: 'and', value: [{ type: 'void' }] });
              setShow(false);
            }}
          >
            And operator
          </button>
          <button
            type="button"
            onClick={() => {
              onChange({ type: 'template', value: [] });
              setShow(false);
            }}
          >
            Templates filter
          </button>
          <button type="button" onClick={() => setShow(false)}>
            Cancel
          </button>
        </div>
      ) : null}
    </>
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
interface FilterProps {
  value: Filter;
  isFirst?: boolean;
  isLast?: boolean;
  isRoot?: boolean;
  onChange: (value: Filter) => void;
  onDelete: () => void;
  path: string;
}

const AbstractFilter = ({
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
