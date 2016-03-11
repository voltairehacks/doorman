import { update } from './util'
import moment from 'moment'
import _ from 'lodash'

export default (state, action) => {

  if (action.type === 'CURRENT_MACS') {
    return update(state, {
      lastSeen: update(state.lastSeen, _.fromPairs(action.payload.map(mac => [mac, moment()])))
    })
  }
  if (action.type === 'PAIR') {
    return update(state, { pairs: update(state.pairs, action.payload) })
  }
  if (action.type === 'SET_PAIRS') {
    return update(state, { pairs: action.payload })
  }
  if (action.type === 'SET_NAME') {
    return update(state, { name: action.payload })
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
  return state || { pairs: {}, name: '', lastSeen: {}, socket: null }
}
