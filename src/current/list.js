import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

import Profile from './profile'

const activeFirst = lastSeen => {
  return (a, b) => {
    const A_BIGGER_PRIORITY = 1
    const B_BIGGER_PRIORITY = -1
    if (lastSeen[a] && !lastSeen[b]) return A_BIGGER_PRIORITY
    if (!lastSeen[a] && lastSeen[b]) return B_BIGGER_PRIORITY
    if (!lastSeen[a] && !lastSeen[b]) return 0
    return lastSeen[a].isBefore(lastSeen[b]) ? B_BIGGER_PRIORITY : A_BIGGER_PRIORITY
  }
}

class CurrentList extends React.Component {
  render() {
    const clients = Object.keys(this.props.lastSeen)
        .sort(mac => activeFirst(this.props.lastSeen))

    const named = clients.filter(c => this.props.pairs[c])
    const extra = clients.length - named.length
    return <div className='profileContainer'>
      {
        named.map(mac => {
          const profile = this.props.pairs[mac]
          return <Profile mac={mac} profile={profile} key={mac.replace(/:/g, '')} />
        })
      }
      { extra ? <p>Also detected { extra } unidentified devices</p> : '' }
    </div>
  }
}

export default connect(state => state)(CurrentList)
