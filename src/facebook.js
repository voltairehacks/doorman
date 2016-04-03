import React from 'react'
import FbLogin from 'react-facebook-login'
import { connect } from 'react-redux'
import AssociateForm from './associate/form'

class FbConnect extends React.Component {
  onLogin(response) {
    if (response.accessToken) {
      FB.api('/me', (profile) => {
        this.props.socket.emit('associate', JSON.stringify({
          name: profile.name,
          email: 'https://graph.facebook.com/' + response.id + '/picture?type=large'
        }))
      })
    }
    this.props.dispatch({
      type: 'FACEBOOK',
      payload: response
    })
  }
  render() {
    if (this.props.facebook) {
      return <AssociateForm />
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
