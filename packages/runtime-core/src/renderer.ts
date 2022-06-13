import { ShapeFlags } from "./createVNode"
import { isString, isNumber } from '@simple-vue3/shared'
import { createVNode, Text, Fragment, isSameVNode  } from './createVNode'
import getSequence from './sequence'

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

  function mountElement(vnode, container, anchor = null) {
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

    hostInsert(el, container, anchor)
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

    // 从前往后比对
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

    // 从后往前比对
    while(i <= prevEnd && i <= nextEnd) {
      const n1 = prev[prevEnd]
      const n2 = next[nextEnd]
      if(isSameVNode(n1,n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      prevEnd--;
      nextEnd--;
    }

    if(i > prevEnd) {
      // 插入节点
      while(i <= nextEnd) {
        const nextPosition = nextEnd + 1
        let anchor = next.length <= nextPosition ? null : next[nextPosition].el
        
        patch(null, next[i], container, anchor)
        i++
      }
    }else if(i > nextEnd) { // 老的多新的少
      if(i <= prevEnd) {
        while(i <= prevEnd) {
          unmount(prev[i])
          i++
        }
      }
    } else {
      // unknown sequence
      let s1 = i;
      let s2 = i;
      const toBePatched = nextEnd - s2 + 1
      const keyToNewIndexMap = new Map() 

      for(let i = s2; i <= nextEnd; i++) {
        keyToNewIndexMap.set(next[i].key, i)
      }

      const sequence = new Array(toBePatched).fill(0)

      for(let i = s1; i <= prevEnd; i++) {
        const oldVNode = prev[i]
        const newIndex = keyToNewIndexMap.get(oldVNode.key) //用老的去找， 看看新的里面有没有
        if(newIndex === undefined) {
          unmount(oldVNode)
        } else {
          // 新节点和老的节点都存在
          patch(oldVNode, next[newIndex], container) // 比较两个节点的差异
          sequence[newIndex - s2] = i + 1
        }
        // keyToNewIndexMap.set(next[i].key, i)
      }
      
      let increase = getSequence(sequence)

      let j = increase.length - 1

      // 按照新的顺序重新排列， 把没有的再加上

      for(let i = toBePatched - 1; i >= 0; i--) {
        const currentIndex = s2 + i
        const child = next[currentIndex]

        let anchor = currentIndex + 1 < next.length ? next[currentIndex + 1].el : null

        // 判断是否是新增的
        // 如果有el说明之前已经创建过
        // if(child.el === null) {
        if(sequence[i] === 0) {
          patch(null, child, container, anchor)
        } else {
          if(i !== increase[j]) {
            hostInsert(child.el, container, anchor)
          } else {
            j--
          }
        
        }
      }
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
    } else {
      nextVNode.el = prevVNode.el
      if(prevVNode.children !== nextVNode.children) {
        hostSetText(nextVNode.el, nextVNode.children)
      }
    }
  }

  function processFragment(prevVNode, nextVNode, container) {
    if(prevVNode === null) {
      mountChildren(nextVNode.children, container)
    } else {
      patchKeyedChildren(prevVNode.children, nextVNode.children, container )
    }
  }

  function processElement(prevVNode, nextVNode, container, anchor = null) {
    if(prevVNode === null) {
      // 挂载元素
      mountElement(nextVNode, container, anchor)
    } else {
      patchElement(prevVNode, nextVNode)
    }
  }

  function unmount(n1) {
    if(n1.type === Fragment) {
      unmountChildren(n1.children)
    } else {
       hostRemove(n1.el)
    }
  }

  function patch(prevVNode, nextVNode, container, anchor = null) {
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
      case Fragment:
        processFragment(prevVNode, nextVNode, container) 
        break
      default:
        if(shapeFlag & ShapeFlags.ELEMENT) {
          processElement(prevVNode, nextVNode, container, anchor)
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