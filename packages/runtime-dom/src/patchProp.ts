import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/events'
import { patchAttr } from './modules/attrs'
// 类名 class
// 样式 style
// 事件
// 其他
export const patchProp = (el, key, prevValue, nextValue) => {
  if(key === 'class') {
    patchClass(el, nextValue)
  } else if(key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if(/on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue)
  } else {
    patchAttr(el, key, nextValue)
  }
}