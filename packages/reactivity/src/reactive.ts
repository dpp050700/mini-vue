import { isObject } from "@simple-vue3/shared";
import { ReactiveFlags, baseHandler } from "./baseHandler";

const reactiveMap = new WeakMap(); // key 必须是对象，弱引用

export function reactive(target) {
  if(!isObject(target)) {
    return target
  }

  // 如果 target 是一个代理对象， 那么访问 ReactiveFlags.IS_REACTIVE 时 会走到 proxy 的 get 方法中
  // 在 get 方法中判断 key 是否为 ReactiveFlags.IS_REACTIVE
  // 如果是 则表明 target 已经是一个代理对象，无需再次代理
  if(target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  const existing = reactiveMap.get(target)

  if(existing) {
    return existing
  }

  const proxy =  new Proxy(target, baseHandler)
  reactiveMap.set(target, proxy )
  return proxy
}

// const person = {
//   name: 'zf',
//   get aliasName() {
//     return this.name + 'JG'
//   }
// }

// Proxy 一般配合 Reflect 使用
// const proxy =  new Proxy(person, {
//   get(target, key, receiver) {
//     console.log(key)
//     // 这里可以记录这个属性使用了那个 effect
//     return Reflect.get(target, key, receiver)
//   },
//   set(target, key, receiver, value) {
//     // 这里可以通知 effect 重新执行
//     //target[key] = value
//     return Reflect.set(target, key, value, receiver)
//   }
// })
// // proxy 上取 aliasName， 这个时候执行 get 方法
// // 但是 aliasName 是基于 name 原则上应该去 name 上取值
// // 然后 name 没有触发 get， 此时我们修改name 不会导致页面重新渲染
// proxy.aliasName