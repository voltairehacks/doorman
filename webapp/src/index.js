import withLatestMacData from './sources/mac'
import withUserProfiles from './sources/users'

import view from './view'

import render from './fluidity'

render(
  [
    withLatestMacData,
    withUserProfiles,
  ],
  view,
  '#root'
)
