import React from 'react'

export default class View extends React.Component {
  render() {
    const isPropertyMissing = ([name]) => !this.props[name]

    const missingValues = [
      ['latestMacs',    'Loading latest mac information...'],
      ['macToUserInfo', 'Loading user information...'],
      ['actions',       'Loading actions...']
    ].filter(isPropertyMissing)

    if (missingValues.length) {
      const missingItem = missingValues[0]
      const missingMessage = missingItem[1]
      return <div>{ missingMessage }</div>
    }

    return <MacList {...this.props} />
  }
}

function MacList({ macToUserInfo, latestMacs, actions }) {
  const userMap = macToUserInfo
  const setMac = actions.setMac
  const macView = mac => {
    return <MacView {...{mac, userMap, setMac}} key={mac} />
  }

  const hasProfile = mac => userMap[mac] && !userMap[mac].unregistered
  const known = Object.keys(latestMacs).filter(hasProfile)
  const unknown = Object.keys(latestMacs).filter(mac => !hasProfile(mac))

  return <div>
    <h2>Known Devices</h2>
    <ul> { known.map(macView) } </ul>
    <h2>Unknown Devices</h2>
    <ul> { unknown.map(macView) } </ul>
  </div>
}

function MacView({mac, userMap, setMac}) {
  if (!userMap[mac] || userMap[mac].unregistered) {
    return UnknownMac({mac, setMac})
  }
  return KnownMac({ mac, profile: userMap[mac], setMac })
}

function UnknownMac({ mac, setMac }) {
  return <li key={mac}>
    Unknown: <strong>{mac}</strong>
    <br/>
    Set name:
    <SetName {...{mac, setMac}} />
  </li>
}

function KnownMac({ mac, profile, setMac }) {
  return <li key={mac}>
    <strong>{profile}</strong> ({mac})
    <br/>
    <SetName {...{mac, setMac, text: 'reset'}} />
  </li>
}

class SetName extends React.Component {
  setMac(ev) {
    ev.preventDefault()
    this.props.setMac(this.props.mac, this.refs.newName.value)
  }

  render() {
    return <div>
      <input ref="newName" />
      <input
        type="submit"
        value={this.props.text || "set"}
        onClick={::this.setMac}
      />
    </div>
  }
}
