export const nodeOps = {
  createElement(tagName) {
    return document.createElement(tagName)
  },
  createTextNode(text) {
    return document.createTextNode(text)
  },
  insert(element, container, anchor = null) {
    container.insertBefore(element,anchor)
  },
  remove(element) {
    const parent = element.parentNode
    if(parent) {
      parent.removeChild(element)
    }
  },
  querySelector(selectors) {
    return document.querySelector(selectors)
  },
  parentNode(element) {
    return element.parentNode
  },
  nextSibling(element) {
    return element.nextSibling
  },
  setText(element, text) { // 给文本节点设置内容
    element.nodeValue = text;
  },
  setElementText(element, text) { // 给元素设置内容
    element.textContent = text;
  }
}