import React from 'react'

function MacView({mac, userMap}) {
  if (!userMap[mac] || userMap[mac].unregistered) {
    return <div>{mac}</div>
  }
  return <div>{mac}<br/>{JSON.stringify(userMap[mac])}</div>
}

export default class View extends React.Component {
  render() {
    const userMap = this.props.macToUserInfo
    const latestMacs = this.props.latestMacs

    if (!userMap) {
      return <div>Loading...</div>
    }
    if (!latestMacs) {
      return <div>Loading...</div>
    }

    const macView = mac => {
      return <MacView {...{mac, userMap}} key={mac}/>
    }
    return <div>
      { Object.keys(this.props.latestMacs).map(macView) }
    </div>
  }
}
