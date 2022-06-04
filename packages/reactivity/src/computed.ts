import { isFunction  } from "@simple-vue3/shared"
import { activeEffect, ReactiveEffect, trackEffect, triggerEffect } from "./effect"

export function computed(getterOptions) {
  let isGetter = isFunction(getterOptions)
  let getter
  let setter
  const fn = () => console.warn('computed readOnly')
  if(isGetter) {
    getter = getterOptions
    setter = fn
  } else {
    getter = getterOptions.get
    setter = getterOptions.set || fn
  }
  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
  private _value
  private _dirty = true 
  setter = null
  getter = null 
  effect = null
  deps = null 
  constructor(getter, setter) {
    this.getter = getter
    this.setter = setter
    this.effect = new ReactiveEffect(getter, () => {
      if(!this._dirty) {
        this._dirty = true 
        triggerEffect(this.deps)
      }
    })
  }

  get value() {
    if(activeEffect) {
      this.deps = this.deps || new Set()
      trackEffect(this.deps)
    }
    if(this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}