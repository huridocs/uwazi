import React, { Component, PropTypes, Children } from 'react'
import { isClient } from './utils'

class Provider extends Component {

	static childContextTypes = {
		getInitialData: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.initialData = isClient ? window.__initialData__ : props.initialData;
	}

	getChildContext() {
		return {
			getInitialData: ::this.getInitialData
		};
	}

	getInitialData(callerInst) {
		if (!callerInst) {
			console.error('getInitialData must be called with the callers instance');
			return;
		}

		if (!this.callerInst) {
			this.callerInst = callerInst;
		}

		if (this.callerInst === callerInst) {
			return this.initialData;
		}
	}

	render() {
		let { children } = this.props;
		return Children.only(children);
	}
}

export default Provider;
