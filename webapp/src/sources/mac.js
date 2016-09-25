import {
  SECONDS,
  OK,
  LOADING,
  ERRORED,
  contexts,
  fallbackTimeToNow,
  setLoading,
  fails,
  update,
  simpleFetch
} from '../constants'

export default function withLatestMacData(viewModel, doUpdate) {
  const namespace = 'mac load'

  if (shouldTriggerMacLoad()) {
    simpleFetch('/latest_macs')
      .then(updateViewModelWithLatestMacs)
      .catch(fails(namespace, doUpdate))
    return setLoading(namespace, viewModel)
  }

  const HEARTBEAT_RELOAD = 600 * SECONDS
  const RETRY_MAC_FETCH = 5 * SECONDS

  function shouldTriggerMacLoad(now) {
    const time = fallbackTimeToNow(now)
    const context = viewModel.loading && viewModel.loading[namespace]

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
          { [namespace]: contexts.success(macs) }
        ),
        latestMacs: macs
      })
    })
  }
}
