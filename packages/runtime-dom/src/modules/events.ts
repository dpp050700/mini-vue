function createInvoker(preValue) {
  const  invoker = (e) => {invoker.value(e)}
  invoker.value = preValue
  return invoker
}

export function patchEvent(el, eventName, nextValue) {
  if(!el._vei) {
    el._vei = {}
  }
  const invokers = el._vei
  const exitingInvoker = invokers[eventName]
  const eName = eventName.slice(2).toLowerCase()

  if(exitingInvoker && nextValue) {
    exitingInvoker.value = nextValue
  }

  if(exitingInvoker && !nextValue) {
    el.removeEventListener(eName, exitingInvoker)
    invokers[eventName] = null
  }

  if(!exitingInvoker && nextValue) {
    const invoker = createInvoker(nextValue)
    invokers[eventName] = invoker
    el.addEventListener(eName, invoker)
  }
  
}