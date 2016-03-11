import React from 'react'

import AssociateForm from './associate/form'
import CurrentlyOnline from './current/list'

export default class Root extends React.Component {
  render() {
    return <div>
      <h1>Voltaire</h1>
      <CurrentlyOnline />
      <h2>Register</h2>
      <AssociateForm />
    </div>
  }
}
