import { isFunction, isObject, isArray } from "@simple-vue3/shared";
import { isReactive } from "./baseHandler";
import { ReactiveEffect } from "./effect";

// set 用来存放迭代过的属性
function traversal(value, set = new Set()) {
  // return source
  if(!isObject(value)) {
    return value
  }
  if(set.has(value)){
    return
  }
  set.add(value)
  for(let key in value) {
    traversal(value[key], set)
  }
  return value
}

export function watch(source, cb) {
  let get
  if(isReactive(source)) {
    get = () => traversal(source)
  } else if(isFunction(source)){
    get = source 
  } else if(isArray(source)){
    // console.log(source)
    source.forEach(item => {
      console.log(item)
      watch(item, cb)
    })
    return
  } else {
    return
  }
  let cleanup
  let oldValue = null
  const onCleanup = (fn) => {
    cleanup = fn
  }
  const job = () => {
    if(cleanup) {
      cleanup()
    }
    let newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    // oldValue = newValue
  }

  const effect = new ReactiveEffect(get, job)
  oldValue = effect.run()
}