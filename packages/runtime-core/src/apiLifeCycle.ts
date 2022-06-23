import { instance, setCurrentInstance } from "./component"

export const enum LifeCycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  UPDATED = 'u'
}

function createInvoker(type) {
  return function(hook, currentInstance = instance) {
    if(currentInstance) {
      
      const lifeCycles = currentInstance[type] || (currentInstance[type] = [])

      const wrapHook = () => {
        setCurrentInstance(currentInstance)
        hook.call(currentInstance) // hook 可能不是箭头函数
        setCurrentInstance(null)
      }

      lifeCycles.push(wrapHook)
    }
  }
}

// 借助函数柯里化

export const onBeforeMount = createInvoker(LifeCycle.BEFORE_MOUNT)

export const onMounted = createInvoker(LifeCycle.MOUNTED)

export const onUpdated = createInvoker(LifeCycle.UPDATED)