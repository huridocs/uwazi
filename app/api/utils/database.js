import fetch from 'isomorphic-fetch'

let database =  {

  reset_testing_database () {
    return fetch('http://127.0.0.1:5984/uwazi_development/', {method:'DELETE'})
    .then((response) => fetch('http://127.0.0.1:5984/uwazi_development/', {method:'PUT'}))
  },

  import (fixture) {
    return fetch('http://127.0.0.1:5984/uwazi_development/_bulk_docs',
    {
      method:'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(fixture)
    })
  }

}

export default database;
