import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
// 类名 class
// 样式 style
// 事件
// 其他
export const patchProp = (el, key, prevValue, nextValue) => {
  if(key === 'class') {
    patchClass(el, nextValue)
  }
  if(key === 'style') {
    patchStyle(el, prevValue, nextValue)
  }
}