import React from 'react'
import FbLogin from 'react-facebook-login'
import { connect } from 'react-redux'

class FbConnect extends React.Component {
  onLogin(response) {
    if (response.status === 'connected') {
      FB.api('/me', (response) => {
        this.props.socket.emit('associate', JSON.stringify({
          name: response.name,
          email: response.email
        }))
      })
    }
    this.props.dispatch({
      type: 'facebook',
      payload: response
    })
  }
  render() {
    if (this.props.facebook && this.props.facebook.status === 'connected') {
      return ''
    }
    return <div className='status'>
      <FbLogin appId='1704606936480498'
        autoload={true}
        callback={::this.onLogin}
      />
    </div>
  }
}

export default connect(state => state)(FbConnect)
