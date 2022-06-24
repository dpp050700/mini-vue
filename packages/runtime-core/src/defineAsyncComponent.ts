import { ref } from "@simple-vue3/reactivity";
import { h } from "./h";
import { Fragment } from "./createVNode";
import { isFunction } from "@simple-vue3/shared";

export function defineAsyncComponent(loaderOptions) {

  if(isFunction(loaderOptions)) {
    loaderOptions = {
      loader: loaderOptions
    }
  }

  let Component = null
  return {
    setup() {
      const { loader, timeout, errorComponent, delay, loadingComponent, onError } = loaderOptions
      const loaded = ref(false)
      const error = ref(false)
      const loading = ref(false)
      let loadingTimer = null
      let errorTimer = null
      if(timeout) {
        errorTimer = setTimeout(() => {
          error.value = true
        }, timeout)
      }
      if(delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, delay)
      } else {
        loading.value = true
      }

      function load() {
        return loader().catch(error => {
          if(onError) {
            return new Promise((resolve,reject) => {
              const retry = () => resolve(load())
              const fail = () => reject()
              onError(retry, fail)
            })
          } else {
            throw error
          }
        })
      }

      load().then(v => {
        loaded.value = true
        Component = v
      }).catch(err => {
        error.value = true

      }).finally(() => {
        loading.value = false
        clearTimeout(loadingTimer)
        clearTimeout(errorTimer)
      })

      return () => {

        if(loaded.value) {
          return h(Component)
        }

        if(error.value && errorComponent) {
          return h(errorComponent)
        }

        if(loading.value && loadingComponent) {
          return h(loadingComponent)
        }

        return h(Fragment)
      }
    }
  }
}