import { track, trigger } from "./effect"

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive"
}

export const baseHandler =  {
  get(target, key, receiver) {
    // console.log(key)
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    track(target, key)

    // 这里可以记录这个属性使用了那个 effect
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    // 这里可以通知 effect 重新执行
    let oldValue = target[key]
    if(oldValue !== value) {
      let result = Reflect.set(target, key, value, receiver)
      trigger(target, key, value)
      return result
    }
  }
}