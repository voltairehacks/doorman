import React from 'react'
import ReactDOM from 'react-dom'

import withLatestMacData from './sources/mac'
import withUserProfiles from './sources/users'

import withUserActions from './actions/user'

import RootView from './view'

import render from './fluidity'

render(
  [
    withLatestMacData,
    withUserProfiles,
    withUserActions,
  ],
  RootView,
  'root'
)
