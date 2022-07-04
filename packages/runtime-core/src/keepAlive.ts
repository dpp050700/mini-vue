import { onMounted, onUpdated } from './apiLifeCycle';
import {  getCurrentInstance } from './component';
import { ShapeFlags } from './createVNode';
export const KeepAlive = {
  __isKeepAlive: true,
  setup(props, { slots }) {
    const keys = new Set(); // 缓存组件的 key
    const cache = new Map(); // 缓存组件的映射关系
    const instance = getCurrentInstance()

    let {createElement, move, unmount} = instance.ctx.render
    let storageContainer = createElement('div')

    instance.ctx.active = (vnode, container, anchor) => {
      move(vnode, container, anchor)
    }

    instance.ctx.deactivate = (n1) => {
      move(n1, storageContainer) // 组件卸载的时候 会将虚拟节点 对应的 真实节点 移动到 storageContainer 中
    }

    let pendingCacheKey = null

    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree)
    }

    const pruneCacheEntry = (vnode) => {
      const subTree = cache.get(vnode)
      resetFlag(subTree)
      unmount(subTree)
      cache.delete(vnode)
      keys.delete(vnode)

    }

    function resetFlag(vnode) {
      if(vnode.shapeFlag & ShapeFlags.COMPONENT_KEEP_ALIVE) {
        vnode.shapeFlag-=ShapeFlags.COMPONENT_KEEP_ALIVE
      }
      if(vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        vnode.shapeFlag-=ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      }
    }

    onMounted(cacheSubTree)

    onUpdated(cacheSubTree)

    return () => {
      let vnode = slots.default()

      // 不是组件不用缓存
      if(!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode
      }
      let comp = vnode.type

      let key = vnode.key === null ? comp : vnode.key
      pendingCacheKey = key


      let cacheVNode = cache.get(key)

      if(cacheVNode) {
        keys.delete(key)
        keys.add(key)
        vnode.component = cacheVNode.component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEEP_ALIVE // 组件走缓存的时候不要初始化
      } else {
        keys.add(key)
        let {max} = props
        if(max && keys.size > max) {
          const fir = keys.values().next().value
          pruneCacheEntry(fir)
        }
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 用来告诉 vnode 卸载的时候 应该缓存
      return vnode
    }
  }
}

// 缓存策略 LRU 算法 (最近最久算法)