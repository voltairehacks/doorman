import {
  SECONDS,
  OK,
  LOADING,
  ERRORED,
  contexts,
  failbackTimeToNow,
  setLoading,
  fails,
  simpleFetch
} from '../constants'

export default function withLatestMacData(viewModel, doUpdate) {
  const namespace = 'mac load'

  if (shouldTriggerMacLoad()) {
    simpleFetch('/latest_macs')
      .then(updateViewModelWithProfiles)
      .catch(fails(namespace, doUpdate))
    return setLoading(namespace, viewModel)
  }

  const HEARTBEAT_RELOAD = 600 * SECONDS
  const RETRY_MAC_FETCH = 5 * SECONDS

  function shouldTriggerMacLoad(now) {
    const time = failbackTimeToNow(now)
    const context = loadingContext[namespace]

    if (context) {
      if (context.type === OK)      return time - context.time > HEARTBEAT_RELOAD
      if (context.type === ERRORED) return time - context.time > RETRY_MAC_FETCH
    }
    return true
  }

  function updateViewModelWithLatestMacs(macs) {
    doUpdate(viewModel => {
      return update(viewModel, {
        loading: update(viewModel.loading, 
          { [namespace]: contexts.succcess(macs) }
        ),
        latestMacs: macs
      })
    })
  }
}
