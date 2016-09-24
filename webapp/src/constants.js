export const SECONDS = 1000

export const OK = 'success'
export const LOADING = 'loading'
export const ERRORED = 'errored'

export const contexts = {}
export const failbackTimeToNow = now => now ? now() : new Date().getTime()

['success', 'loading', 'errored'].forEach(name => {
  contexts[name] = (result, now) => {
    const time = failbackTimeToNow(now)
    return {
      type: name,
      time,
      kash: result
    }
  }
})

export function update() {
  return Object.assign.apply({}, arguments)
}

export function setLoading(namespace, viewModel) {
  return update(viewModel, {
    loading: update(
      viewModel.loading,
      { [namespace]: contexts.loading() }
    )
  })
}

export function fails(namespace, doUpdate) {
  return error => {
    doUpdate(viewModel => {
      return update(viewModel, {
        loading: update(
          viewModel.loading,
          { [namespace]: contexts.errored(error) }
        )
      })
    })
  }
}

export function simpleFetch(url) {
  return fetch(url).then(res => res.body())
}
