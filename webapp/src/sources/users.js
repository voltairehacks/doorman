import _ from 'lodash'
import {
  OK,
  LOADING,
  ERRORED,
  JSON_HEADER,
  contexts,
  failbackTimeToNow,
  update,
  setLoading,
  fails
} from '../constants'

export default function withUserProfiles(viewModel, doUpdate) {

  const namespace = 'user profiles'

  if (shouldFetchUserProfiles()) {
    fetchUsers()
      .then(updateViewModelWithProfiles)
      .catch(fails(namespace, doUpdate))
    return setLoading(namespace, viewModel)
  } else {
    return viewModel
  }

  function shouldFetchUserProfiles() {
    const latestMacs = viewModel.latestMacs
      ? Object.keys(viewModel.latestMacs) : null
    const userInfo = viewModel.macToUserInfo || {}
    const isLoading = viewModel.loading
      && viewModel.loading[namespace]
      && viewModel.loading[namespace].type === 'loading'
    const hasNoMacs = !latestMacs

    if (isLoading) {
      return false
    }
    if (hasNoMacs) {
      return false
    }
    const missingMacs = latestMacs.filter(mac => !userInfo[mac])
    const areThereMissingMacs = missingMacs.length > 0
    return areThereMissingMacs
  }

  function fetchUsers() {
    return fetch('/profiles', {
        headers: JSON_HEADER,
        method: 'POST',
        body: JSON.stringify(missingUserData())
      })
      .then(result => result.json())

    function missingUserData() {
      const macToUserInfo = viewModel.macToUserInfo || {}
      if (!viewModel.latestMacs) {
        return []
      }
      return Object.keys(viewModel.latestMacs).filter(
        mac => !macToUserInfo[mac]
      )
    }
  }

  function updateViewModelWithProfiles(userProfiles) {
    doUpdate(viewModel => {
      return update(viewModel, {
        loading: update(viewModel.loading,
          { [namespace]: contexts.success(userProfiles) }
        ),
        macToUserInfo: update(viewModel.macToUserInfo, userProfiles)
      })
    })
  }
}
