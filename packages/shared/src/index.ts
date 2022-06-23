
export const isObject = (value) => {
  return typeof value === 'object' && value !== null
}

export const isFunction = (value) => {
  return typeof value === 'function'
}

export const isArray = (value) => {
  return Array.isArray(value)
}

export const isString = (value) => {
  return typeof value === 'string'
}

export const isNumber = (value) => {
  return typeof value === 'number'
}

export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

export function invokerFn(fns) {
  for(let i = 0; i < fns.length; i++) {
    fns[i]()
  }
}