import React, {Component, PropTypes} from 'react';
import SidePanel from 'app/Layout/SidePanel';
import {connect} from 'react-redux';

import 'app/Viewer/scss/createmodal.scss';

export class CreateReferencePanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.referencePanel};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Create document reference</h1>
        <div className="input-group">
          <input type="text" placeholder="Search document title" className="form-control"/><span className="input-group-addon"><i className="fa fa-search"></i></span>
        </div>
        <div className="item-group">
          <li>
            <div className="item"><span className="item-name">207 97 Africa Legal Aid (on behalf of Isaac and Robert Banda) Gambia (The)</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">003 12 Peter Joseph Chacha v The United Republic of Tanzania</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">13 88 Hadjali Mohamad Algeria</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">137 94 139 94 154 96 161 97 International PEN, Constitutional Rights Project, Civil...</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">147 95 149 96 Sir Dawda K. Jawara Gambia (The)</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">212 98 Amnesty International Zambia</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">220 98 Law Offices of Ghazi Suleiman Sudan</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">227 99 Democratic Republic of Congo Burundi, Rwanda, Uganda</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">266 03 Kevin Mgwanga Gunme et al Cameroon</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">269 03 INTERIGHTS (on behalf of Safia Yakubu Husaini et al) Nigeria</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">272 03 Association of Victims of Post Electoral Violence &amp; INTERIGHTS Cameroon</span></div>
          </li>
          <li>
            <div className="item"><span className="item-name">275 03 Article 19 Eritrea</span></div>
          </li>
        </div>
        <ul className="search__filter search__filter--radiobutton">
          <li>Relationship type</li>
          <li className="is-active"><i className="fa fa-check"></i>
            <label>Based on</label>
          </li>
          <li> <i className="fa"></i>
            <label>Support to</label>
          </li>
          <li> <i className="fa"></i>
            <label>Contradicts</label>
          </li>
          <li> <i className="fa"></i>
            <label>Judgements</label>
          </li>
        </ul>
      </SidePanel>
    );
  }
}

CreateReferencePanel.propTypes = {
  referencePanel: PropTypes.bool
};

const mapStateToProps = (state) => {
  return {
    referencePanel: state.documentViewer.uiState.toJS().referencePanel
  };
};

export default connect(mapStateToProps)(CreateReferencePanel);
