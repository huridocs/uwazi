import { Parser } from 'html-to-react';
import PropTypes from 'prop-types';
import React from 'react';

const myParser = new Parser();
const stringToReact = string => myParser.parse(string);

const SafeHTML = ({ children }) => <React.Fragment>{stringToReact(children)}</React.Fragment>;

SafeHTML.propTypes = {
  children: PropTypes.string.isRequired,
};

export default SafeHTML;
