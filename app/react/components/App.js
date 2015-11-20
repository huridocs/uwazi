import React, { Component } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'
import './scss/App.scss'

class App extends Component {

	render() {
		return (
			<div>
				<Helmet
					titleTemplate='Uwazi - %s'
					meta={[
						{'char-set': 'utf-8'},
						{'name': 'description', 'content': 'My super dooper dope app'}
					]}
				/>
				<nav>
					<ul>
						<li><Link to='/'>Home</Link></li>
						<li><Link to='/users'>Users</Link></li>
						<li><Link to='/login'>Login</Link></li>
					</ul>
				</nav>
				<div className='route-content'>
					{this.props.children}
				</div>
			</div>
		)
	}
}

export default App;
