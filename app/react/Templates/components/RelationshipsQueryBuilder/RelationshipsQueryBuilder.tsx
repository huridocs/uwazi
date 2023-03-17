/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
import React from 'react';
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

const boxContainerStyles = {
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

const AddElement = ({ isFirst }: { isFirst: boolean }) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast />
    <div style={boxContainerStyles}>
      <div style={{ ...nodeStyles, border: 'none' }}>
        <input type="button" value="+" />
      </div>
    </div>
  </div>
);

interface MatchNodeProps {
  value: MatchQueryInputType;
  isFirst?: boolean;
  isLast?: boolean;
}

const MatchNode = ({ value, isFirst, isLast }: MatchNodeProps) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast={isLast} />
    <div style={boxContainerStyles}>
      <div style={nodeStyles}>
        <input type="text" value={value.templates[0]} />
      </div>
    </div>
    {value.traverse?.length ? (
      <div style={verticalEdgeStyles}>
        <div style={upEdgeStylesRight} />
        <div style={downEdgeStylesRight} />
      </div>
    ) : null}
    <div style={childrenStyles}>
      {value.traverse?.map((traversal, index) => (
        <TravesalNode value={traversal} isFirst={index === 0} />
      ))}
      <AddElement isFirst={value.traverse?.length === 0} />
    </div>
  </div>
);

interface TravesalNodeProps {
  value: TraverseQueryInputType;
  isFirst?: boolean;
  isLast?: boolean;
}

const TravesalNode = ({ value, isFirst, isLast }: TravesalNodeProps) => (
  <div style={boxStyles}>
    <Edges isFirst={isFirst} isLast={isLast} />
    <div style={boxContainerStyles}>
      <div style={nodeStyles}>
        <input type="text" value={value.direction} />
        <input type="text" value={value.types.join(', ')} />
      </div>
    </div>
    {value.match.length ? (
      <div style={verticalEdgeStyles}>
        <div style={upEdgeStylesRight} />
        <div style={downEdgeStylesRight} />
      </div>
    ) : null}
    <div style={childrenStyles}>
      {value.match.map((match, index) => (
        <MatchNode value={match} isFirst={index === 0} />
      ))}
      <AddElement isFirst={value.match.length === 0} />
    </div>
  </div>
);

interface RelationshipsQueryBuilderProps {
  value: TraverseInputType;
}

export const RelationshipsQueryBuilder = ({ value }: RelationshipsQueryBuilderProps) => (
  <div className="form-control" style={{ ...boxStyles, height: 'unset' }}>
    <div style={boxContainerStyles}>
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
        <TravesalNode value={traversal} isFirst={index === 0} />
      ))}
      <AddElement isFirst={value?.length === 0} />
    </div>
  </div>
);
