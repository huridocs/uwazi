# Universal React

This boilerplate aims at solving the MVP (Minimal Viable Product) of a universal app without making extraneous decisions for you (e.g. flux,	 layouts, testing, linting). The aim is to keep the codebase simple and readable for you to extend.

## Features

- Universal routing ([react-router](https://github.com/rackt/react-router))
- Hot reloading
- Title, meta, css, and scripts overridable by each component ([react-helmet](https://github.com/nfl/react-helmet))
- Universal data fetching/rehydration on the client ([isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch))
- No other templating engines - React from root down
- 404 and redirect handling

As you're more than likely to want to style your app you can also import scss (see `App.js`). It's easy to add css, less, or whatever you like using a webpack loader.

## Install & run

```
npm i && npm start
```

Go to `http://localhost:3000/users` to see isomorphic data fetching.

## Adding routes

Add your routes in `Routes.js`.

```js
<Route path='users' component={Users} />
```

## Title and Meta


The parent `App.js` defines the base title and meta in a `Helmet` component. Any sub-component can override/add properties (even adding scripts and css). See the [react-helmet docs](https://github.com/nfl/react-helmet) for more info.

## Data fetching and client hydration

If the route component needs to fetch data it should define a static `requestState` method which returns a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) (or a [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) for multiple requests):

```js
static requestState() {
	return fetch('http://jsonplaceholder.typicode.com/users')
		.then(function(response) {
			if (response.status >= 400) {
				throw new Error('Bad response from server');
			}
			return response.json();
		});
}
```

If your component has a `requestState` method and it's the first route (pre-rendered by the server), then the data will already be available via `context.getInitialData(this)` (or `this.context` outside the constructor), e.g:

```js
static contextTypes = {
	getInitialData: PropTypes.func
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
```

This ensures the server and client renders are isomorphic.
