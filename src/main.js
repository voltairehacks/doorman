// Boilerplaty!
import { createStore, applyMiddleware, compose } from 'redux'
import ReactDOM from 'react-dom'
import React from 'react'
import { Provider } from 'react-redux'
import socket from 'socket.io-client'
import thunk from 'redux-thunk'

import reducer from './reducer'
import Root from './root'

const store = createStore(reducer, null, compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f
))

const io = socket()

store.dispatch({ type: 'SET_SOCKET', payload: io })

io.on('connect', () => { store.dispatch({ type: 'CONNECTED' }) })

io.on('disconnect', () => store.dispatch({ type: 'DISCONNECTED' }))

io.on('clients', (data) => store.dispatch({ type: 'CURRENT_MACS', payload: data }))

io.on('pairs', (data) => store.dispatch({ type: 'SET_PAIRS', payload: data }))

io.on('profile', (data) => store.dispatch({ type: 'SET_PROFILE', payload: data }))

io.on('new_pair', (data) => store.dispatch({ type: 'PAIR', payload: data }))

ReactDOM.render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.getElementById('content')
)
