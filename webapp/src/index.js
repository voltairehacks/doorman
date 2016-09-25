import React from 'react'
import ReactDOM from 'react-dom'

import withLatestMacData from './sources/mac'
import withUserProfiles from './sources/users'

import RootView from './view'

import render from './fluidity'

render(
  [
    withLatestMacData,
    withUserProfiles,
  ],
  RootView,
  'root'
)
