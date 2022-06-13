
export default function getSequence(arr) {
  let len = arr.length
  let res = [0]
  let p = new Array(len).fill(undefined)
  let lastIndex
  let start
  let end
  let middle
  for(let i = 0; i < len; i++) {
    const arrI = arr[i]
    if(arrI !== 0) { // 0 在vue中是新增节点
      lastIndex = res[res.length - 1]
      if(arrI > arr[lastIndex]) {
        p[i] = lastIndex
        res.push(i)
        continue
      }

      start = 0
      end = res.length - 1
      while(start < end) {
        middle = Math.floor((start + end) / 2)
        if(arr[res[middle]] < arrI) {
          start = middle + 1
        }else {
          end = middle
        }
      }
      if(arrI < arr[res[end]]) {
        p[i] = res[end - 1]
        res[end] = i
      }
    }
  }
  let i = res.length
  let last = res[i - 1]
  while(i-- > 0) {
    res[i] = last
    last = p[last]
  }
  return res
}