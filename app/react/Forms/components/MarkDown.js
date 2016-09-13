import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import marked from 'marked';

export class MarkDown extends Component {

  render() {
    const rows = this.props.rows || 6;
    return (
      <Tabs className="markdownEditor">
        <div className="tab-nav">
          <TabLink to="edit" default>Edit</TabLink>
          <TabLink to="preview">Preview</TabLink>
          <a className="tab-link tab-link--help" href="https://guides.github.com/features/mastering-markdown/" target="_blank">help</a>
        </div>
        <TabContent for="edit">
          <textarea className="form-control" rows={rows} onChange={this.props.onChange} value={this.props.value}/>
        </TabContent>
        <TabContent for="preview" className="markdownViewer">
          <div dangerouslySetInnerHTML={{__html: marked(this.props.value, {sanitize: true})}}></div>
        </TabContent>
      </Tabs>
    );
  }

}

MarkDown.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  rows: PropTypes.number
};

export default MarkDown;

const MarkDownField = createFieldClass({
  MarkDown: controls.textarea
});

export {MarkDownField};
