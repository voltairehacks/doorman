import React from 'react'

function MacView({mac, userMap}) {
  return <div>{mac}</div>
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
