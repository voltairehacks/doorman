import React from 'react'
import ReactDOM from 'react-dom'

import { EventEmitter } from 'events'

export default function render(sources, view, anchor) {
  let store

  const source = new EventEmitter()
  const eventName = 'new store'
  source.on(eventName, onNewStore)

  setNewStore({})
  
  let updating = false
  let updateInterrupted = false

  function onNewStore(newStore) {
    store = newStore
    if (updating) {
      updateInterrupted = true
      return
    }

    updateInterrupted = false
    updating = true

    for (var presenter of presenters) {
      evaluateAndReplaceStore(presenter(store, doUpdate))
    }

    actuallyRender(store, view, anchor)
    updating = false

    if (updateInterrupted) {
      onNewStore(store)
    }
  }

  function evaluateAndReplaceStore(newStore) {
    if (newStore && newStore !== store) {
      setNewStore(newStore)
    }
  }

  function doUpdate(updateFunction){
    evaluateAndReplaceStore(updateFunction(store))
  }

  function setNewStore(newStore) {
    source.emit(eventName, newStore)
  }
}

function actuallyRender(store, view, anchor) {
  ReactDOM.render(<view {...store} />, document.querySelector(anchor))
}
