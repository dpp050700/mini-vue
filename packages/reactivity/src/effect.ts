
export let activeEffect = undefined

/**
 * 依赖收集的原理是 借助 js 是单线程的原理，默认调用effect 的时候会去proxy的get，
 * 此时让属性记住依赖的 effect，同时也让 effect 记住对应的属性
 * 靠的是数据结构 weakMap: {map: {key: new Set(), key2: new Set()}}
 */

export class ReactiveEffect {
  active = true
  parent = null
  deps = [] // effect 中用了哪些属性，后续清理的时候要使用 
  fn = null
  constructor(fn) {
    this.fn = fn
  }

  run() {
    if(!this.active) {
      return this.run()
    }else {
      try{
        this.parent = activeEffect
        activeEffect =  this
        cleanEffect(this)
        return this.fn()
      } finally {
        activeEffect = this.parent
        this.parent = null
      }
    }
    
  }
}


// {object: {key1: [effect1,effect2], key2: [effect1,effect2 ]}}
const targetMap = new WeakMap()
export function track(target, key) {
  // console.log(target, key, activeEffect)
  if(activeEffect) {
    // 依赖收集
    let depsMap = targetMap.get(target)
    if(!depsMap) {
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    let deps = depsMap.get(key)
    if(!deps) {
      deps = new Set()
      depsMap.set(key, deps)
    }
    let shouldTrack = !deps.has(activeEffect)
    if(shouldTrack) {
      deps.add(activeEffect)
      console.log(deps,111)
      activeEffect.deps.push(deps) // 放的是 set
    }
  }

  // console.log(activeEffect,targetMap)
}

export function trigger(target, key, value) {
  let depsMap = targetMap.get(target)
  if(!depsMap) {
    return // 属性没有依赖任何的 effect
  }

  let effects = depsMap.get(key)
  // debugger
  if(!effects) {
    return
  }
  effects.forEach(_effect => {
    if(_effect !== activeEffect) { // 保证要执行的 effect 不是当前的 effect
      _effect.run() // 重新执行 effect
    }
  })
}

export function effect(fn) {
  // 将函数 fn 变成响应式的effect
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

function cleanEffect(effect) {
  // 需要清理effect中存入属性set中的 effect
}