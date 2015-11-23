import React, { Component } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'
import './scss/App.scss'
import UserWidget from './UserWidget'

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

        <nav className="nav navbar-nav navbar-default navbar-fixed-top">
          <div className="container-fluid">
           <div className="navbar-header">
             <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
               <span className="sr-only">Toggle navigation</span>
               <span className="icon-bar"></span>
               <span className="icon-bar"></span>
               <span className="icon-bar"></span>
             </button>
             <li><Link to='/' className="navbar-brand">Uwazidocs</Link></li>
           </div>
           <div id="navbar" className="navbar-collapse collapse">
             <ul className="nav navbar-nav">
              <li><Link to='/'>Home</Link></li>
              <li><Link to='/users'>Users</Link></li>
             </ul>
             <UserWidget/>
           </div>
       </div>
     </nav>
        <div className='container'>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default App;
