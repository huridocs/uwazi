import React, {PropTypes} from 'react';
//import './scss/modal.scss';


let List = ({children}) => {
  return <div className="item-group">{children}</div>;
};

let ItemName = ({children}) => {
  return <div className="item-name">{children}</div>;
};

let ItemFooter = ({children}) => {
  return <div className="item-metadata">{children}</div>;
};

let ProgressBar = ({progress}) => {
  return (
    <div>
      <span className="label label-info">
        <i className="fa fa-upload"></i>
        <span>{progress} % Complete</span>
      </span>
      <div className="progress">
        <div className="progress-bar" style={{width: `${progress}%`}} />
      </div>
    </div>
  );
};

let ItemLabel = ({children, status}) => {
  let icon = 'fa-check';
  if (status === 'danger') {
    icon = 'fa-close';
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

let RowListItem = ({children, status}) => {
  return (
    <li className="col-sm-4">
      <div className={'item item-status item-' + (status || 'success')}>
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
RowListItem.propTypes = {children: childrenType, status: PropTypes.string};
ItemFooter.propTypes = {children: childrenType};
ItemLabel.propTypes = {children: childrenType, status: PropTypes.string};
ItemName.propTypes = {children: childrenType};
ProgressBar.propTypes = {children: childrenType, progress: PropTypes.number};

export {List, RowList, ItemFooter, ItemName};
