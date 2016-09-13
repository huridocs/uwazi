import React, {PropTypes, Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {Form} from 'react-redux-form';

import {addLink, sortLink} from 'app/Settings/actions/navlinksActions';
import NavlinkForm from './NavlinkForm';


export class NavlinksSettings extends Component {

  render() {
    const {links} = this.props;
    const nameGroupClass = 'template-name form-group';

    return (
      <div className="row relationType">
        <div className="col-xs-12">
          <Form model="settings.navlinksData" className="navLinks">

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
                {links.map((link, i) => {
                  return (
                    <NavlinkForm key={link.localID}
                                 index={i}
                                 id={link.localID}
                                 link={link}
                                 sortLink={this.props.sortLink} />
                  );
                })}
              </ul>
              <div className="panel-body">
                <a className="btn btn-success"
                   onClick={this.props.addLink}>
                  <i className="fa fa-plus"></i>&nbsp;<span>Add link</span>
                </a>
              </div>

            </div>

          </Form>
        </div>
      </div>
    );
  }
}

NavlinksSettings.propTypes = {
  links: PropTypes.array,
  addLink: PropTypes.func.isRequired,
  sortLink: PropTypes.func.isRequired
};

const mapStateToProps = ({settings}) => {
  const links = settings.navlinksData.links;
  return {links};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({addLink, sortLink}, dispatch);
}

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps)(NavlinksSettings)
);
