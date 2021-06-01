import MarkdownViewer from 'app/Markdown';
import React, { Component } from 'react';
import { TabContent, TabLink, Tabs } from 'react-tabs-redux';

export interface MarkDownType {
  onChange: () => {};
  value?: string;
  rows?: number;
  htmlOnViewer?: boolean;
  showPreview?: boolean;
}

export default class MarkDown extends Component<MarkDownType> {
  render() {
    const { rows = 6, value = '', onChange, showPreview = true } = this.props;
    return (
      <div className="markdownEditor">
        <Tabs renderActiveTabContentOnly>
          <div className="tab-nav">
            <TabLink to="edit" default>
              Edit
            </TabLink>
            {showPreview && <TabLink to="preview">Preview</TabLink>}
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
          {showPreview && (
            <TabContent for="preview" className="markdownViewer">
              <MarkdownViewer html={this.props.htmlOnViewer} markdown={value} />
            </TabContent>
          )}
        </Tabs>
      </div>
    );
  }
}
