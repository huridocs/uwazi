import React from 'react';
import NewTemplate from './NewTemplate';
import TemplateCreator from './components/TemplateCreator';

export default class NewEntity extends NewTemplate {
  render() {
    return <TemplateCreator entity={true}/>;
  }
}
