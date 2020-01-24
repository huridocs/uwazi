/** @format */

import MarkdownViewer from 'app/Markdown';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';

export default class MarkDown extends Component {
  render() {
    const { rows } = this.props;
    const { value, onChange } = this.props;
    return (
      <Tabs renderActiveTabContentOnly className="markdownEditor">
        <div className="tab-nav">
          <TabLink to="edit" default>
            Edit
          </TabLink>
          <TabLink to="preview">Preview</TabLink>
          <a
            className="tab-link tab-link--help"
            href="https://guides.github.com/features/mastering-markdown/"
            target="_blank"
            rel="noopener noreferrer"
          >
            help
          </a>
        </div>
        <TabContent for="edit">
          <textarea className="form-control" rows={rows} onChange={onChange} value={value} />
        </TabContent>
        <TabContent for="preview" className="markdownViewer">
          <MarkdownViewer html={this.props.htmlOnViewer} markdown={value} />
        </TabContent>
      </Tabs>
    );
  }
}

MarkDown.defaultProps = {
  value: '',
  rows: 6,
  htmlOnViewer: false,
};

MarkDown.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  rows: PropTypes.number,
  htmlOnViewer: PropTypes.bool,
};
