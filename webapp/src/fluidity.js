import React from 'react'
import ReactDOM from 'react-dom'

import { EventEmitter } from 'events'

import { update } from './constants'

export default function render(sources, view, anchor) {

  var state, updating = false, updateQueue = []

  const events = new EventEmitter()
  const eventName = 'new state'

  events.on(eventName, latestState => {
    actuallyRender(latestState, view, anchor)
  })

  const setInitialState = () => ({})
  onNewMessage(setInitialState)

  function onNewMessage(message) {
    updateQueue.push(message)
    if (updating) {
      return
    }

    updating = true

    while (updateQueue.length) {
      message = updateQueue.shift()

      tryEvaluation(message)
      for (var source of sources) {
        tryEvaluation(source)
      }
    }

    updating = false
  }

  function tryEvaluation(source) {
    try {
      const result = source(state, doUpdate)
      evaluateAndReplaceState(result)
    } catch (e) {
      console.error('Uncaught error while evaluating source', e)
    }
  }

  function evaluateAndReplaceState(newState) {
    if (newState && !Object.is(state, newState)) {
      state = update({}, newState)
      console.log('replacing state with', newState)
      events.emit(eventName, state)
    }
  }

  function doUpdate(updateFunction){
    onNewMessage(updateFunction)
  }

  function getState() {
    return state
  }

  function subscribe(listener) {
    events.on(eventName, listener)
  }

  function unsubscribe(listener) {
    events.off(listener)
  }

  return {
    getState,
    doUpdate,
    subscribe,
    unsubscribe
  }
}

function actuallyRender(state, MainComponent, anchor) {
  ReactDOM.render(
    <MainComponent {...state} />,
    document.getElementById(anchor)
  )
}
