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

/**
 * 默认初始化时 _dirty 被设为 true ，在 getter 方法中表示开关打开，需要计算一遍computed 的值，然后关闭开关，之后再获取 computed 的值时由于 _dirty 是 false 就不会重新计算。这就是 computed 缓存值的实现原理
 */
class ComputedRefImpl {
  private _value
  private _dirty = true 
  setter = null
  getter = null 
  effect = null
  deps = null 
  private __v_isRef = true
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