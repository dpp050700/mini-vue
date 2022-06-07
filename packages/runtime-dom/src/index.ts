import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

import { createRenderer } from '@simple-vue3/runtime-core';

export * from '@simple-vue3/runtime-core'

const renderOptions = {patchProp, ...nodeOps}

export function render(vnode, container) {
  let { render } = createRenderer(renderOptions)
  return render(vnode, container)

}

