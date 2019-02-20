import React from 'react';
import { connect } from 'react-redux';

export function DocumentSearchPanel(props) {
  const { doc } = props;
  console.log('DOC', doc);
  return (
    <div>
      test
    </div>
  );
}

export default connect()(DocumentSearchPanel);
