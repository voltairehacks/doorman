import React from 'react'

import AssociateForm from './associate/form'
import CurrentlyOnline from './current/list'
import FbConnect from './facebook'

export default class Root extends React.Component {
  render() {
    return <div>
      <h1><i className="fa fa-bell-o"></i> Voltaire's Doorman</h1>
      <CurrentlyOnline />
      <FbConnect />
    </div>
  }
}
