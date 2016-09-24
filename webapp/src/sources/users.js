import _ from 'lodash'
import {
  OK,
  LOADING,
  ERRORED,
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
    const userInfo = viewModel.macToUserInfo || {}
    const isLoading = viewModel.loading && viewModel.loading[namespace]
    const hasNoMacs = !latestMacs || !latestMacs.length

    if (isLoading) {
      return false
    }
    if (hasNoMacs) {
      return false
    }
    const areThereMissingMacs = latestMacs.reduce(
      (boolResult, mac) => boolResult || !userInfo[mac]
    )
    return areThereMissingMacs
  }

  function fetchUsers() {
    return fetch('/users', { body: missingUserData() })
      .then(result => result.body())

    function missingUserData() {
      if (!viewModel.latestMacs) {
        return []
      }
      return viewModel.latestMacs.filter(
        mac => !viewModel.macToUserInfo[mac]
      )
    }
  }

  function updateViewModelWithProfiles(userProfiles) {
    doUpdate(viewModel => {
      return update(viewModel, {
        loading: update(viewModel.loading,
          { [namespace]: contexts.succcess(userProfiles) }
        ),
        macToUserInfo: update(viewModel.macToUserInfo,
          _.zip(userProfiles.map(user => [user.mac, user]))
        )
      })
    })
  }
}
