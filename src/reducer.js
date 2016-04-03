import { update } from './util'
import moment from 'moment'
import _ from 'lodash'

const seenInLastTwoMinutes = lastSeen => {
  return lastSeen ? moment().isBefore(lastSeen.add(moment.duration(120000))) : false
}

export default (state, action) => {
  if (action.type === 'FACEBOOK') {
    return update(state, {
      facebook: action.payload,
      name: action.payload.name,
      email: 'https://graph.facebook.com/' + action.payload.id + '/picture?type=large'
    })
  }
  if (action.type === 'CURRENT_MACS') {
    const old = _.fromPairs(
      Object.keys(state.lastSeen)
        .filter(e => seenInLastTwoMinutes(state.lastSeen[e]))
        .map(mac => [mac, state.lastSeen[mac]])
    )
    return update(state, {
      lastSeen: update(old, _.fromPairs(action.payload.map(mac => [mac, moment()])))
    })
  }
  if (action.type === 'PAIR') {
    return update(state, { pairs: update(state.pairs, action.payload) })
  }
  if (action.type === 'SET_PAIRS') {
    return update(state, { pairs: action.payload })
  }
  if (action.type === 'SET_NAME') {
    return update(state, action.payload)
  }
  if (action.type === 'CONNECTED') {
    return update(state, { connected: true })
  }
  if (action.type === 'DISCONNECTED') {
    return update(state, { connected: false })
  }
  if (action.type === 'SET_SOCKET') {
    return update(state, { socket: action.payload })
  }
  return state || { pairs: {}, name: '', lastSeen: {}, socket: null, facebook: null }
}
