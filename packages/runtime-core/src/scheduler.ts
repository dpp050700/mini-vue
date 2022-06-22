const queue = []

let isFlushing = false

const resolvePromise = Promise.resolve()

export function queueJob(job) {
  if(!queue.includes(job)) {
    queue.push(job)
  }

  if(!isFlushing) {
    isFlushing = true
    resolvePromise.then(() => {
      isFlushing = false
      let copyQueue = queue.slice(0)
      queue.length = 0
      for(let i = 0; i < copyQueue.length; i++) {
        let job = copyQueue[i]
        job()
      }
      copyQueue.length = 0
    })
  }
}