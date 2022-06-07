import { isString, isArray } from "@simple-vue3/shared"

export function isVNode(value) {
  return !!value.__v_isVNode
}

export function createVNode(type, props = null, children = null) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
  const vnode = {
    type,
    props,
    children,
    key: props && props.key,
    el: null,
    shapeFlag,
    __v_isVNode: true
  }

  if(children) {
    let temp = 0
    if(isArray(children)) {
      temp = ShapeFlags.ARRAY_CHILDREN
    } else {
      children = String(children)
      temp = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = vnode.shapeFlag | temp
  }

  return vnode
 }

export const enum ShapeFlags {
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEEP_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}