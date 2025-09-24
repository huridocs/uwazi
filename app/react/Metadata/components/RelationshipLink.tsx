import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { I18NLink } from '../../I18N/index.js';
import { IStore } from '../../istore.js';
// @ts-expect-error TS(2307): Cannot find module '../../Layout.js' or its corres... Remove this comment to see the full error message
import { Icon } from '../../Layout.js';
import * as actions from '../../Relationships/actions/actions';

interface RelationshipLinkProps {
  propValue: any;
}

const mapStateToProps = ({ entityView }: IStore) => ({
  uiState: entityView.uiState,
});

function mapDispatchToProps(dispatch: Dispatch<{}>) {
  return bindActionCreators(
    {
      selectConnection: actions.selectConnection,
    },
    dispatch
  );
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & RelationshipLinkProps;

const RelationshipLink = ({ propValue: propVal, selectConnection }: mappedProps) => {
  if (propVal.relatedEntity) {
    return (
      <button
        type="button"
        className="link-button"
        onClick={() => selectConnection(propVal.relatedEntity)}
        key={propVal.url}
      >
        {propVal.icon && <Icon className="item-icon" data={propVal.icon} />}
        {propVal.value}
      </button>
    );
  }
  return (
    <I18NLink key={propVal.url} to={propVal.url}>
      {propVal.icon && <Icon className="item-icon" data={propVal.icon} />}
      {propVal.value}
    </I18NLink>
  );
};

const container = connector(RelationshipLink);
export { container as RelationshipLink };
