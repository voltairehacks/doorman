import {
  contexts,
  JSON_HEADER,
  setLoading,
  fails,
  update,
} from '../constants'


export default function withUserActions(viewModel, doUpdate) {
  const namespace = 'set mac'

  if (!viewModel.actions || !viewModel.actions.setMac) {
    return update(viewModel, {
      actions: update(viewModel.actions, { setMac })
    })
  }

  function setMac(mac, name) {
    return doUpdate(viewModel => {
      fetch('/admin_associate', {
        method: 'POST',
        headers: JSON_HEADER,
        body: JSON.stringify({ mac, profile: name })
      })
        .then(result => {
          return result.json()
        })
        .then(result => {
          if (result.success) {
            return updateViewModelWithProfile(mac, name)
          } else {
            return fails(namespace, doUpdate)(result)
          }
        })
        .catch(fails(namespace, doUpdate))

      return setLoading(namespace, viewModel)
    })
  }

  function updateViewModelWithProfile(mac, name) {
    doUpdate(viewModel => {
      return update(viewModel, {
        loading: update(viewModel.loading,
          { [namespace]: contexts.success({ success: true }) }
        ),
        macToUserInfo: update(viewModel.macToUserInfo, { [mac]: name })
      })
    })
  }
}
