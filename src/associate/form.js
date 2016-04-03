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
    this.props.dispath({
      type: 'SET_NAME',
      payload: {
        name: this.refs.name.value,
        email: this.refs.email.value
      }
    })
  }
  update(ev) {
    this.setState({})
  }
  render() {
    return <form onSubmit={::this.submit}>
      <label htmlFor='name'>Your name:</label>
      <input name='name' onChange={::this.update} ref='name' defaultValue={this.props.name} />
      <label htmlFor='email'>Image:</label>
      <input name='email' onChange={::this.update} ref='email' defaultValue={this.props.email} />
      <button type='submit' disabled={!this.refs.name || !this.refs.name.value || !this.refs.email.value}>Submit</button>
    </form>
  }
}

export default connect(state => state, {
  setProfile: (name) => ({ type: 'SET_PROFILE', payload: name })
})(AssociateForm)
