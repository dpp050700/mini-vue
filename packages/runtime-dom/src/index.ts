import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export * from '@simple-vue3/runtime-core'

const renderOptions = {patchProp, ...nodeOps}