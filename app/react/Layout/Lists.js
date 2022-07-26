// TEST!!! Entire file is untested
import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from 'UI';

const List = ({ children }) => <div className="item-group">{children}</div>;

const ItemName = ({ children }) => (
  <div className="item-name">
    <span>{children}</span>
  </div>
);

const ItemFooter = ({ children, onClick }) => (
  <div className="item-actions" onClick={onClick}>
    {children}
  </div>
);

const ProgressBar = ({ progress }) => {
  let message = `${progress} % Completed`;
  let icon = 'upload';
  if (progress === 0 || progress === 100) {
    message = 'Processing...';
    icon = 'clock';
  }
  return (
    <div className="label-progress">
      <span className="label label-info">
        <Icon icon={icon} /> <span>{message}</span>
      </span>
      <div className="progress">
        <div
          className="progress-bar progress-bar-striped active"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const ItemLabel = ({ children, status }) => {
  let icon = '';
  if (status === 'success') {
    icon = <Icon icon="check" />;
  }
  if (status === 'danger') {
    icon = <Icon icon="times" />;
  }
  if (status === 'warning') {
    icon = <Icon icon="exclamation-triangle" />;
  }
  return (
    <span className={`label label-${status || 'default'}`}>
      {icon} <span>{children}</span>
    </span>
  );
};

ItemFooter.Label = ItemLabel;
ItemFooter.ProgressBar = ProgressBar;

const RowList = ({ children, zoomLevel }) => (
  <div className={`item-group item-group-zoom-${zoomLevel}`}>{children}</div>
);

const RowListItem = ({
  children,
  status,
  onClick,
  onMouseEnter,
  onMouseLeave,
  active,
  className,
}) => {
  let activeClass = '';
  if (active === true) {
    activeClass = 'is-active';
  }
  if (active === false) {
    activeClass = 'is-disabled';
  }

  return (
    <div
      className={`${className} item item-status item-${status || 'default'} ${activeClass}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

RowList.Item = RowListItem;

const childrenType = PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]);

List.propTypes = { children: childrenType };

RowList.defaultProps = {
  children: '',
  zoomLevel: 0,
};

RowList.propTypes = {
  children: childrenType,
  zoomLevel: PropTypes.number,
};

RowListItem.propTypes = {
  children: childrenType,
  status: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool,
  className: PropTypes.string,
};
ItemFooter.propTypes = { children: childrenType, onClick: PropTypes.func };
ItemLabel.propTypes = { children: childrenType, status: PropTypes.string };
ItemName.propTypes = { children: childrenType };
ProgressBar.propTypes = { children: childrenType, progress: PropTypes.number };

export { List, RowList, ItemFooter, ItemName };
