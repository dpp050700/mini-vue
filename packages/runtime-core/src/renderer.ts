import { ShapeFlags } from "./createVNode"
import { isString, isNumber } from '@simple-vue3/shared'
import { createVNode, Text, isSameVNode  } from './createVNode'

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

  function patchProps(oldProps, newProps, container) {
    if(oldProps === null) oldProps = {}
    if(newProps === null) newProps = {}

    // 新的覆盖老的
    for(let key in newProps) {
      hostPatchProp(container, key, oldProps[key], newProps[key])
    }

    // 老的有的 新的没有 要删除
    for(let key in oldProps) {
      if(!newProps[key]) {
        hostPatchProp(container, key, oldProps[key], null)
      }
    }
  }

  function mountElement(vnode, container) {
    let {type, props, children, shapeFlag} = vnode
    // 后续需要比对虚拟节点的差异，所以需要保留对应的真实节点
    let el = hostCreateElement(type)
    vnode.el = el

    if(props) {
      patchProps(null, props, el)
    }

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    }

    if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }

  function unmountChildren(children) {
    children.forEach(child => {
      unmount(child)
    })
  }

  function patchKeyedChildren(prev, next, container) {
    let i = 0
    let prevEnd = prev.length - 1
    let nextEnd = next.length - 1

    while(i <= prevEnd && i <= nextEnd) {
      const n1 = prev[i]
      const n2 = next[i]
      if(isSameVNode(n1,n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      i++;

    }
  }

  function patchChildren(prevVNode, nextVNode, container) {
    let prevChildren = prevVNode.children
    let nextChildren = nextVNode.children
    let prevShapeFlag = prevVNode.shapeFlag
    let nextShapeFlag = nextVNode.shapeFlag
    /**
     * 新的   旧的    操作
     * 文本   数组    删除旧的儿子，设置文本
     * 文本   文本    更新文本
     * 文本   空      设置文本
     * 数组   数组    diff 算法
     * 数组   文本    清空文本，挂载数组
     * 数组   空      挂载
     * 空     数组    删除所有儿子
     * 空     文本    删除所有文本
     * 空     空
     */

    if(nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {

      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(prevChildren)
      }
      hostSetElementText(container, nextChildren)

    } else if(nextShapeFlag & ShapeFlags.ARRAY_CHILDREN){
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 前后都是数组 进行 diff 算法
        patchKeyedChildren(prevChildren, nextChildren, container)
      } else {
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 清空文本
          hostSetElementText(container, null)
        }
        // 挂载
        mountChildren(nextChildren, container)
      }
    } else {
      if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空文本
        hostSetElementText(container, null)
      }else if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(prevChildren)
      }
      
    }
  }

  function patchElement(prevVNode, nextVNode) {
    const el = prevVNode.el
    nextVNode.el = el
    patchProps(prevVNode.props, nextVNode.props, el)
    patchChildren(prevVNode, nextVNode, el)
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
    } else {
      patchElement(prevVNode, nextVNode)
    }
  }

  function unmount(n1) {
    hostRemove(n1.el)
  }

  function patch(prevVNode, nextVNode, container) {
    // prevVNode 为 null 说明是初次渲染
    // prevVNode 有值说明为更新， 走 diff 算法

    // 判断 type 和 key 是否一样
    if(prevVNode && !isSameVNode(prevVNode, nextVNode)) {
      unmount(prevVNode)
      prevVNode = null
    }

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
      if(container._vnode) {
        unmount(container._vnode)
      }
    }else {
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode // 第一次渲染的时候将 vnode 保存到 container
  }

  return {
    render
  }
}