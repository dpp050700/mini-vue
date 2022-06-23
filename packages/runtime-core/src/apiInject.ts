import { instance } from "./component";

export function provide(key, value) {
  // provide 必须用在 setup 中
  if(!instance) return

  let parentProvides =  instance.parent && instance.parent.provides

  let currentProvides = instance.provides
  if(currentProvides === parentProvides) {
    currentProvides = instance.provides = Object.create(parentProvides)
  }
  currentProvides[key] = value

}

export function inject(key, defaultValue) {
  if(!instance) return

  const provides = instance.parent?.provides

  if(provides && (key in provides)) {
    return provides[key]
  } else {
    return defaultValue
  }
}