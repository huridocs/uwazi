import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import marked from 'marked';

export class MarkDown extends Component {

  render() {
    return (
        <Tabs>
          <TabLink to="edit" default>Edit</TabLink>
          <TabLink to="preview">Preview</TabLink>
          <TabContent for="edit">
            <textarea className="form-control" onChange={this.props.onChange} value={this.props.value}/>
          </TabContent>
          <TabContent for="preview">
            <div dangerouslySetInnerHTML={{__html: marked(this.props.value, {sanitize: true})}}></div>
          </TabContent>
          <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">help</a>
        </Tabs>
    );
  }

}

MarkDown.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default MarkDown;

const MarkDownField = createFieldClass({
  MarkDown: controls.textarea
});

export {MarkDownField};
