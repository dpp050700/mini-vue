import { ShapeFlags } from "./createVNode"
import { isString, isNumber } from '@simple-vue3/shared'
import { createVNode, Text  } from './createVNode'

export function createRenderer(options) {

  let {
    createElement: hostCreateElement,
    createTextNode: hostCreateTextNode,
    insert: hostInsert,
    remove: hostRemove,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setText: hostSetText,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    // createComment: hostCreateComment,
    // setScopeId: hostSetScopeId,
    // cloneNode: hostCloneNode,
    // insertStaticContent: hostInsertStaticContent
  } = options

  function normalize(children, i) {
    if (isString(children[i]) || isNumber(children[i])) {
      // 给文本加标识 不能直接给字符串+ ， 得给对象+
      children[i] = createVNode(Text, null, children[i]); // 需要换掉以前存的内容
  }
  return children[i];
  }

  function mountChildren(children, container) {
    for(let i = 0; i < children.length; i++) {
      let child = normalize(children, i)
      // child 可能是文本节点， 对文本节点做处理
      patch(null, child, container)
    }
  }

  function mountElement(vnode, container) {
    let {type, props, children, shapeFlag} = vnode
    // 后续需要比对虚拟节点的差异，所以需要保留对应的真实节点
    let el = hostCreateElement(type)
    vnode.el = el

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    }

    if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }

  function processText(prevVNode, nextVNode, container) {
    if(prevVNode === null) {
      const el = hostCreateTextNode(nextVNode.children)
      nextVNode.el = el
      hostInsert(el, container)
    }
  }

  function processElement(prevVNode, nextVNode, container) {
    if(prevVNode === null) {
      // 挂载元素
      mountElement(nextVNode, container)
    }
  }

  function patch(prevVNode, nextVNode, container) {
    // prevVNode 为 null 说明是初次渲染
    // prevVNode 有值说明为更新， 走 diff 算法

    const { type, shapeFlag} = nextVNode
    switch (type) {
      case Text:
        processText(prevVNode, nextVNode, container)
        break;
    
      default:
        if(shapeFlag & ShapeFlags.ELEMENT) {
          processElement(prevVNode, nextVNode, container)
        }
        break;
    }
    // if(prevVNode === null) {
    //   // 挂载元素
    //   mountElement(nextVNode, container)
    // }

  }

  function render(vnode, container) {
    if(vnode === null) {
      // 卸载
    }else {

      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode // 第一次渲染的时候将 vnode 保存到 container
  }

  return {
    render
  }
}