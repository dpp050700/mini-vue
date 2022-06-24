import { isVNode, createVNode } from "./createVNode"
import { isObject, isArray } from "@simple-vue3/shared"

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length
  if( l === 2) {
    if(isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if(isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      return createVNode(type, null, propsOrChildren)
    }
  }else {
    if(l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    }else if(l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children || [])
  }
}