import { reactive } from "@simple-vue3/reactivity"
import { isFunction, hasOwn, isObject } from "@simple-vue3/shared"
import { proxyRefs } from '@simple-vue3/reactivity'
import { ShapeFlags } from "./createVNode"

export let instance = null

export const getCurrentInstance = () => instance

export const setCurrentInstance = (i) => instance = i

export function createComponentInstance(vnode) {
  let instance = {
    data: null,
    vnode: vnode,
    subTree: null, // 组件对应的渲染的虚拟节点
    isMounted: false, // 组件是否挂载过
    update: null, // 组件的 effect.run方法
    render: null,
    propsOptions: vnode.type.props || {},
    props: {}, // 用户接收的属性
    attrs: {}, // 未接收的属性
    slots: {}, // 存放组件所有插槽

    proxy: null, //代理对象
    setupState: {},
    exposed: {} // 暴露的方法属性
  }

  return instance
}

function initProps(instance, rawProps) {
  const props = {}
  const attrs = {}
  const options = instance.propsOptions
  if(rawProps) {
    for(let key in rawProps) {
      const value = rawProps[key]
      // 还需要校验值的类型
      if(key in options) {
        props[key] = value
      }else {
        attrs[key] = value
      }
    }
  }
  instance.props = reactive(props) // TODO 浅响应式
  instance.attrs = attrs
}

function initSlots(instance, children) {
  if(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  }
}


const publicProperties = {
  $attrs: (instance) => instance.attrs,
  $slots:(instance) => instance.slots,
}

const instanceProxy = {
  get(target, key, receiver) {
    const { data,props,setupState } = target
    if(data && hasOwn(data, key)) {
      if(hasOwn(props, key)) {
        console.warn('data has prop:'+ key)
      }
      return data[key]
    }
    if(setupState && hasOwn(setupState, key)) {
      
      return setupState[key]
    }
    if(props && hasOwn(props, key)) {
      
      return props[key]
    }

    let getter = publicProperties[key]
    if(getter) {
      return getter(target)
    }
  },
  set(target, key, value, receiver) {
    const { data,props,setupState } = target
    if(data && hasOwn(data, key)) {
      data[key] = value
    } else if(setupState && hasOwn(setupState, key)) {
      setupState[key] = value
    } else if(props && hasOwn(props, key)) {
      console.warn('props not update')
      return false
    }
    return true
  }
}

export function setupComponent(instance) {
  const {type, props, children} = instance.vnode
  let {data, render, setup} = type

  initProps(instance, props)
  initSlots(instance, children)

  instance.proxy = new Proxy(instance, instanceProxy)

  if(data) {
    if(!isFunction(data)) {
      return console.warn('data must function')
    }
    instance.data = reactive(data.call({}))
  }

  if(setup) {
    const context = {
      emit: (eventName, ...args) => {
        const name = `on${eventName.slice(0,1).toUpperCase() + eventName.slice(1)}`
        let invoker = instance.vnode.props[name]
        invoker && invoker(...args)
      },
      attrs: instance.attrs,
      slots: instance.slots,
      expose: (exposed) => {
        instance.exposed = exposed || {}
      }
    }

    setCurrentInstance(instance)
    const setupResult = setup(instance.props, context)
    setCurrentInstance(null)

    if(isFunction(setupResult)) {
      instance.render = setupResult
    } else if(isObject(setupResult)){
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if(!instance.render) {
    if(render) {
      instance.render = render
    } else {
      // 模板编辑
    }
  }

}