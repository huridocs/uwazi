import React, {PropTypes} from 'react';

let List = ({children}) => {
  return <div className="item-group">{children}</div>;
};

let ItemName = ({children}) => {
  return <div className="item-name"><span>{children}</span></div>;
};

let ItemFooter = ({children, onClick}) => {
  return <div className="item-actions" onClick={onClick}>{children}</div>;
};

let ProgressBar = ({progress}) => {
  let message = `${progress} % Completed`;
  let icon = 'fa fa-upload';
  if (progress === 100) {
    message = 'Processing...';
    icon = 'fa fa-clock-o';
  }
  return (
    <div className="label-progress">
      <span className="label label-info">
        <i className={icon}></i>&nbsp;
        <span>{message}</span>
      </span>
      <div className="progress">
        <div className="progress-bar progress-bar-striped active" style={{width: `${progress}%`}} />
      </div>
    </div>
  );
};

let ItemLabel = ({children, status}) => {
  let icon = '';
  if (status === 'success') {
    icon = 'fa fa-check';
  }
  if (status === 'danger') {
    icon = 'fa fa-close';
  }
  if (status === 'warning') {
    icon = 'fa fa-warning';
  }
  return (
    <span className={'label label-' + (status || 'default')}>
      <i className={icon}></i>
      <span>{children}</span>
    </span>
  );
};

ItemFooter.Label = ItemLabel;
ItemFooter.ProgressBar = ProgressBar;

let RowList = ({children}) => {
  return <div className="item-group">{children}</div>;
};

let RowListItem = ({children, status, onClick, active, className}) => {
  let activeClass = '';
  if (active === true) {
    activeClass = 'is-active';
  }
  if (active === false) {
    activeClass = 'is-disabled';
  }

  return (
    <div className={className + ' item item-status item-' + (status || 'default') + ' ' + activeClass} onClick={onClick}>
      {children}
    </div>
  );
};
RowList.Item = RowListItem;

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array,
  PropTypes.string
]);

List.propTypes = {children: childrenType};
RowList.propTypes = {children: childrenType};
RowListItem.propTypes = {
  children: childrenType,
  status: PropTypes.string,
  onClick: PropTypes.func,
  active: PropTypes.bool,
  className: PropTypes.string
};
ItemFooter.propTypes = {children: childrenType, onClick: PropTypes.func};
ItemLabel.propTypes = {children: childrenType, status: PropTypes.string};
ItemName.propTypes = {children: childrenType};
ProgressBar.propTypes = {children: childrenType, progress: PropTypes.number};

export {List, RowList, ItemFooter, ItemName};
