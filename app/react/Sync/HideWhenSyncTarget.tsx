import React from 'react';
import { connect } from 'react-redux';

import { IStore } from 'app/istore';

type PropTypes = {
  children: React.ReactNode;
  isSyncTarget?: boolean;
};

const HideWhenSyncTarget: React.FC<PropTypes> = ({ children, isSyncTarget = false }: PropTypes) =>
  isSyncTarget ? null : <>{children}</>;

HideWhenSyncTarget.defaultProps = {
  isSyncTarget: false,
};

const mapStateToProps = ({ settings }: IStore) => ({
  isSyncTarget: settings.collection.get('syncTarget'),
});

export default connect(mapStateToProps)(HideWhenSyncTarget);
