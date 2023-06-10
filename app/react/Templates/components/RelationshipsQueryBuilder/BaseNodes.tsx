/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { Filter } from 'shared/types/api.v2/templates.createTemplateRequest';
import {
  EdgesProps,
  edgeContainerStyles,
  edgeStyles,
  boxStyles,
  nodeContainerStyles,
  nodeStyles,
  childrenStyles,
} from './styles';

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
          <button
            type="button"
            onClick={() => {
              onChange({ type: 'select', property: '', value: [] });
              setShow(false);
            }}
          >
            Select metadata filter
          </button>
          <button type="button" onClick={() => setShow(false)}>
            Cancel
          </button>
        </div>
      ) : null}
    </>
  );
};

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

export { Edges, AddElement, AddFilterButton, Node, FilterNode };
