import React, {PropTypes} from 'react';

let List = ({children}) => {
  return <div className="item-group">{children}</div>;
};

let ItemName = ({children}) => {
  return <div className="item-name">{children}</div>;
};

let ItemFooter = ({children, onClick}) => {
  return <div className="item-metadata" onClick={onClick}>{children}</div>;
};

let ProgressBar = ({progress}) => {
  return (
    <div>
      <span className="label label-info">
        <i className="fa fa-upload"></i>
        <span>{progress} % Complete</span>
      </span>
      <div className="progress">
        <div className="progress-bar progress-bar-striped" style={{width: `${progress}%`}} />
      </div>
    </div>
  );
};

let ItemLabel = ({children, status}) => {
  let icon = 'fa-check';
  if (status === 'danger') {
    icon = 'fa-close';
  }
  if (status === 'warning') {
    icon = 'fa-warning';
  }
  return (
    <span className={'label label-' + (status || 'success')}>
      <i className={'fa ' + icon}></i>
      <span>{children}</span>
    </span>
  );
};

ItemFooter.Label = ItemLabel;
ItemFooter.ProgressBar = ProgressBar;

let RowList = ({children}) => {
  return <div className="item-group row">{children}</div>;
};

let RowListItem = ({children, status, onClick, active}) => {
  let activeClass = '';
  if (active === true) {
    activeClass = 'is-active';
  }
  if (active === false) {
    activeClass = 'is-disabled';
  }

  return (
    <li className={'col-sm-4'} onClick={onClick}>
      <div className={'item item-status item-' + (status || 'success') + ' ' + activeClass}>
        {children}
      </div>
    </li>
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
RowListItem.propTypes = {children: childrenType, status: PropTypes.string, onClick: PropTypes.func, active: PropTypes.bool};
ItemFooter.propTypes = {children: childrenType, onClick: PropTypes.func};
ItemLabel.propTypes = {children: childrenType, status: PropTypes.string};
ItemName.propTypes = {children: childrenType};
ProgressBar.propTypes = {children: childrenType, progress: PropTypes.number};

export {List, RowList, ItemFooter, ItemName};
