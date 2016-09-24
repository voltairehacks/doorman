import withLatestMacData from './sources/mac'
import withUserProfiles from './sources/users'
import withUserActions from './actions/user'

import view from './view'

import render from './fluidity'

render(
  [
    withLatestMacData,
    withUserProfiles,
    withUserActions
  ],
  view,
  '#root'
)
