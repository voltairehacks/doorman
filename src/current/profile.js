import React from 'react'
import Gravatar from 'react-gravatar'

export default class Profile extends React.Component {
  render() {
    const profile = JSON.parse(this.props.profile)
    const email = profile.email ? profile.email.indexOf('@') !== -1 : null
    return <div className='profile'>
      <div className='imageContainer'>
      { email
        ? <Gravatar email={profile.email} size={128} />
        : <img className='profileImage' src={profile.email} />
      }
      </div>
      <br/>
      <div className='nameContainer'>{profile.name}</div>
    </div>
  }
}
