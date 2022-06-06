import { isObject } from "@simple-vue3/shared"
import { activeEffect, trackEffect, triggerEffect } from "./effect"
import { reactive } from "./reactive"

export function ref(value) {
  return new RefImpl(value)
}

export function toReactive(value) {
  if(isObject(value)) {
    return reactive(value)
  }
  return value
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  let result = {}
  for(let key in object) {
    result[key] = toRef(object, key)
  }
  return result
}

export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver)
      return r.__v_isRef ? r.value : r
      // return target[key].value
    },
    set(target, key, value, receiver) {
      
      if(target[key].__v_isRef) {
        target[key].value = value
        return true
      }
      return Reflect.set(target, key, value, receiver)
    }
  })
}

class ObjectRefImpl {
  constructor(public object, public key) {}
  private __v_isRef = true
  get value() {
    return this.object[this.key]
  }
  set value(newValue) {
    this.object[this.key] = newValue
  }
}

class RefImpl {
  private _value = null
  private dep
  private __v_isRef = true
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    if(activeEffect) {
      trackEffect(this.dep || (this.dep = new Set()))
    }
    
    return this._value
  }
  set value(newValue) {
    if(newValue !== this.rawValue){
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffect(this.dep)
    }
  }
}