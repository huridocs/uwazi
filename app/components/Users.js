import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

class Users extends Component {

	static contextTypes = {
		getInitialData: PropTypes.func
	}

	static requestState() {
		return fetch('http://jsonplaceholder.typicode.com/users')
			.then(function(response) {
				if (response.status >= 400) {
					throw new Error('Bad response from server');
				}
				return response.json();
			});
	}

	constructor(props, context) {
		super(props, context);

		if (!context.getInitialData(this)) {
			Users.requestState().then(users => {
				this.setState({ users: users });
			});
		}

		this.state = {
			users: context.getInitialData(this)
		}
	}

	renderUsers() {
		if (this.state.users) {
			return (
				<ul>
					{this.state.users.map(user => {
						return <li key={user.id}>{user.name}</li>;
					})}
				</ul>
			)
		} else {
			return (
				<p>Fetching...</p>
			);
		}
	}

	render() {
		return (
			<div>
				<Helmet
					title='Users'
					meta={[
						{'name': 'description', 'content': 'A list of our users'}
					]}
				/>
				<h5>Users:</h5>
				{this.renderUsers()}
			</div>
		)
	}
}

export default Users;