import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

class AssociateForm extends React.Component {
  submit(ev) {
    ev.preventDefault()
    if (!this.refs.name.value) {
      return
    }
    const profile = {
      name: this.refs.name.value,
      email: this.refs.email.value
    }
    this.props.socket.emit('associate', JSON.stringify(profile))
    this.props.setProfile(profile)
  }
  update(ev) {
    this.setState({})
  }
  render() {
    return <form onSubmit={::this.submit}>
      <label htmlFor='name'>Your name:</label>
      <input name='name' onChange={::this.update} ref='name'/>
      <label htmlFor='email'>Gravatar email or image:</label>
      <input name='email' onChange={::this.update} ref='email'/>
      <button type='submit' disabled={!this.refs.name || !this.refs.name.value || !this.refs.email.value}>Submit</button>
    </form>
  }
}

export default connect(state => state, {
  setProfile: (name) => ({ type: 'SET_PROFILE', payload: name })
})(AssociateForm)
