import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { I18NLink } from 'app/I18N';
import { Icon } from 'app/UI';
import { IStore } from 'app/istore';
import * as actions from '../../Relationships/actions/actions';

interface RelationshipLinkProps {
  prop: any;
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

const RelationshipLink = ({ prop: propVal, selectConnection }: mappedProps) =>
  propVal.value.map((prop: any) => {
    if (prop.relatedEntity) {
      return (
        <a
          onClick={() => selectConnection(prop.relatedEntity)}
          key={prop.url}
          style={{ cursor: 'pointer' }}
        >
          {prop.value}
        </a>
      );
    }
    return (
      <I18NLink key={prop.url} to={prop.url}>
        {prop.icon && <Icon className="item-icon" data={prop.icon} />}
        {prop.value}
      </I18NLink>
    );
  });

const container = connector(RelationshipLink);
export { container as RelationshipLink };
