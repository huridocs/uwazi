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

let ItemLabel = ({children}) => {
  return (
    <span className="label label-success">
      <i className="fa fa-check"></i>
      <span>{children}</span>
    </span>
  );
};

ItemFooter.Label = ItemLabel;

let RowList = ({children}) => {
  return <div className="item-group row">{children}</div>;
};

let RowListItem = ({children}) => {
  return (
    <li className="col-sm-4">
      <div className="item item-status item-success">
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
RowListItem.propTypes = {children: childrenType};
ItemFooter.propTypes = {children: childrenType};
ItemLabel.propTypes = {children: childrenType};
ItemName.propTypes = {children: childrenType};

export {List, RowList, ItemFooter, ItemName};
