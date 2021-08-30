import React, {createContext, useReducer} from 'react';

const initialState = {progress: 0};
const store = createContext(initialState);
const { Provider } = store;

import * as types from './actionTypes';

const StateProvider = ( { children }:{children:any} ) => {
	const [state, dispatch] = useReducer((state, action) => {
		switch(action.type) {
			case types.ATTACHMENT_COMPLETE:
				const newState = {progress:100}
				return newState;
			default:
				throw new Error();
		}
	}, initialState);
	
	return <Provider>{children}</Provider>;
};

export { store, StateProvider }
