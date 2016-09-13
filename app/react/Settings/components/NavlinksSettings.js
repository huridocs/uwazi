import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';

import update from 'react/lib/update';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import NavlinkForm from './NavlinkForm';
// import {FormField} from 'app/Forms';

// import {bindActionCreators} from 'redux';
// import {DropTarget} from 'react-dnd';
// import {Form} from 'react-redux-form';
// import {FormField} from 'app/Forms';
// import {Link} from 'react-router';
// import {actions as formActions} from 'react-redux-form';

// import {inserted, addProperty} from 'app/Templates/actions/templateActions';
// import MetadataProperty from 'app/Templates/components/MetadataProperty';
// import RemovePropertyConfirm from 'app/Templates/components/RemovePropertyConfirm';
// import validator from './ValidateTemplate';

export class NavlinksSettings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      navlinks: [
        {localID: 1, title: 'Link 1', name: 'Un name', url: 'http://google.com'},
        {localID: 2, title: 'Link 2', name: 'Otro name', url: 'http://apple.com'},
        {localID: 3, title: 'Link 3', name: 'Tercero', url: 'http://apple.com'}
      ]
    };
  }

  moveLink(dragIndex, hoverIndex) {
    const {navlinks} = this.state;
    const dragItem = navlinks[dragIndex];

    this.setState(update(this.state, {
      navlinks: {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragItem]
        ]
      }
    }));
  }

  render() {
    const {navlinks} = this.state;
    const nameGroupClass = 'template-name form-group';

    return (
      <div className="row relationType">
        <div className="col-xs-12">
          <form className="navLinks">

            <div className="panel panel-default">

              <div className="panel-heading">
                <div className={nameGroupClass}>
                  Navigation Links
                </div>
                &nbsp;
                <button type="submit" className="btn btn-success">
                  <i className="fa fa-save"/> Save
                </button>
              </div>

              <ul className="list-group">
                {navlinks.map((link, i) => {
                  return (
                    <NavlinkForm key={link.localID}
                                 index={i}
                                 id={link.localID}
                                 link={link}
                                 moveLink={this.moveLink.bind(this)} />
                  );
                })}
              </ul>
              <div className="panel-body">
                <a className="btn btn-success" href="/settings/documents/new">
                  <i className="fa fa-plus"></i>&nbsp;<span>Add link</span>
                </a>
              </div>

            </div>

          </form>
        </div>
      </div>
    );
    // console.log(this.props);
    // const {settings} = this.props;
    // console.log(settings.toJS());
  //   const {connectDropTarget, formState} = this.props;
  //   let nameGroupClass = 'template-name form-group';
  //   if (formState.fields.name && !formState.fields.name.valid && (formState.submitFailed || formState.fields.name.dirty)) {
  //     nameGroupClass += ' has-error';
  //   }
    // let nameGroupClass = 'template-name form-group';
    // let navLinks = [
    //   {localID: 1, title: 'Link 1', url: 'http://google.com'},
    //   {localID: 2, title: 'Link 2', url: 'http://apple.com'}
    // ];

    // return (
    //   <div className="row relationType">
    //     <div className="col-xs-12">
    //       <form className="">

    //         <div className="panel panel-default">

    //           <div className="panel-heading">
    //             <div className={nameGroupClass}>
    //               Navigation Links
    //             </div>
    //             &nbsp;
    //             <button type="submit" className="btn btn-success">
    //               <i className="fa fa-save"/> Save
    //             </button>
    //           </div>

    //           <ul className="list-group">
    //             {navLinks.map((link, index) => {
    //               return (
    //                 <li className="list-group-item" key={link.localID} index={index}>
    //                   <div>
    //                     <span className="property-name">
    //                       <i className="fa fa-reorder"></i>&nbsp;
    //                       <i className="fa fa-link"></i>&nbsp;&nbsp;{link.title}
    //                     </span>
    //                     <button type="button" className="btn btn-danger btn-xs pull-right property-remove">
    //                       <i className="fa fa-trash"></i> Delete
    //                     </button>
    //                     &nbsp;
    //                     <button type="button" className="btn btn-default btn-xs pull-right property-edit">
    //                       <i className="fa fa-pencil"></i> Edit
    //                     </button>
    //                   </div>

    //                   <div className="propery-form expand">
    //                     <div>
    //                       <div className="row">
    //                         <div className="col-sm-12">
    //                           <div className="input-group">
    //                             <span className="input-group-addon">Title</span>
    //                             <input className="form-control" name="template.data.properties[0].label" />
    //                           </div>
    //                         </div>
    //                       </div>
    //                       <div className="row">
    //                         <div className="col-sm-12">
    //                           <div className="input-group">
    //                             <span className="input-group-addon">URL</span>
    //                             <input className="form-control" name="template.data.properties[0].url" />
    //                           </div>
    //                         </div>
    //                       </div>
    //                     </div>
    //                   </div>


    //                 </li>
    //               );
    //             })}
    //           </ul>
    //           <div className="panel-body">
    //             <a className="btn btn-success" href="/settings/documents/new">
    //               <i className="fa fa-plus"></i>&nbsp;<span>Add link</span>
    //             </a>
    //           </div>

    //         </div>

    //       </form>
    //     </div>
    //   </div>
    // );

  //   return <div>
  //           <RemovePropertyConfirm />
  //           <Form
  //             model="template.data"
  //             onSubmit={this.props.saveTemplate}
  //             className="metadataTemplate panel-default panel"
  //             validators={validator(this.props.template.properties, this.props.templates.toJS(), this.props.template._id)}
  //           >
  //             <div className="metadataTemplate-heading panel-heading">
  //               <Link to={this.props.backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>
  //               &nbsp;
  //               <div className={nameGroupClass}>
  //                 <FormField model="template.data.name">
  //                   <input placeholder="Template name" className="form-control"/>
  //                 </FormField>
  //                 {(() => {
  //                   if (this.props.formState.fields.name &&
  //                       this.props.formState.fields.name.dirty &&
  //                       this.props.formState.fields.name.errors.duplicated) {
  //                     return <div className="validation-error">
  //                               <i className="fa fa-exclamation-triangle"></i>
  //                               &nbsp;
  //                               Duplicated name
  //                           </div>;
  //                   }
  //                 })()}
  //               </div>
  //               &nbsp;
  //               <button type="submit" className="btn btn-success save-template" disabled={!!this.props.savingTemplate}>
  //                 <i className="fa fa-save"/> Save
  //               </button>
  //             </div>

  //             {connectDropTarget(
  //               <ul className="metadataTemplate-list list-group">
  //                 {this.props.template.properties.map((config, index) => {
  //                   return <MetadataProperty {...config} key={config.localID} index={index}/>;
  //                 })}
  //                 {(() => {
  //                   return <div className="no-properties">
  //                           <span className="no-properties-wrap"><i className="fa fa-clone"></i>Drag properties here</span>
  //                          </div>;
  //                 })()}
  //               </ul>
  //             )}

  //           </Form>
  //         </div>;
  }
}

NavlinksSettings.propTypes = {
  settings: PropTypes.object
};

// const target = {
//   canDrop() {
//     return true;
//   },

//   drop(props, monitor) {
//     let item = monitor.getItem();

//     let propertyAlreadyAdded = props.template.properties[item.index];

//     if (propertyAlreadyAdded) {
//       props.inserted(item.index);
//       return;
//     }

//     props.addProperty({label: item.label, type: item.type}, props.template.properties.length);
//     return {name: 'container'};
//   }
// };

// let dropTarget = DropTarget('METADATA_OPTION', target, (connector) => ({
//   connectDropTarget: connector.dropTarget()
// }))(NavlinksSettings);

// export {dropTarget};

const mapStateToProps = (state) => {
  console.log(state);
  const {settings} = state;
  return {settings: settings.collection};
};

// function mapDispatchToProps(dispatch) {
//   return bindActionCreators({inserted, addProperty, setErrors: formActions.setErrors}, dispatch);
// }

// export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(dropTarget);
// export default connect(mapStateToProps)(NavlinksSettings);

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps)(NavlinksSettings)
);
