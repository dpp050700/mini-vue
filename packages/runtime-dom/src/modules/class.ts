export function patchClass(el, nextValue){
  if(nextValue === null) {
    el.removeAttribute()
  } else {
    el.className = nextValue
  }
}