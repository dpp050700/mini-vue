
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
  scheduler = null
  constructor(fn, scheduler?) {
    this.fn = fn
    this.scheduler = scheduler
  }

  run() {
    if(!this.active) {
      return this.fn()
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
  stop() {
    if(this.active) {
      this.active = false
      cleanEffect(this)
    }
  }
}


// {object: {key1: [effect1,effect2], key2: [effect1,effect2 ]}}
const targetMap = new WeakMap()
export function track(target, key) {
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
    trackEffect(deps)
  }
}

export function trackEffect(deps) {
  let shouldTrack = !deps.has(activeEffect)
  if(shouldTrack) {
    deps.add(activeEffect)
    activeEffect.deps.push(deps) // 放的是 set
  }
}

export function trigger(target, key, value) {
  let depsMap = targetMap.get(target)
  if(!depsMap) {
    return // 属性没有依赖任何的 effect
  }

  let effects = depsMap.get(key)
  // debugger
  triggerEffect(effects)
  
}

export function triggerEffect(effects) {
  if(effects) {
    effects = new Set(effects)
    effects.forEach(_effect => {
      if(_effect !== activeEffect) { // 保证要执行的 effect 不是当前的 effect
        if(_effect.scheduler) {
          _effect.scheduler()
        }else {
          _effect.run() // 重新执行 effect
        }
      }
    })
  }
}

export function effect(fn, options = {} as any) {
   
  // 将函数 fn 变成响应式的effect
  const _effect = new ReactiveEffect(fn, options.scheduler)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

function cleanEffect(effect) {
  // 需要清理effect中存入属性set中的 effect
  // 每次执行前都需要将 effect 中对应属性的set集合清理掉 
  let deps = effect.deps
  for(let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}