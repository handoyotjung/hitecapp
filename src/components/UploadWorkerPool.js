/**
 * UploadWorkerPool.js
 * 
 * A lightweight semaphore-based parallel worker pool.
 * Ensures exactly `concurrency` upload tasks run simultaneously.
 * Remaining tasks sit in a FIFO queue and are drained automatically
 * as slots free up.
 * 
 * Usage:
 *   const pool = new UploadWorkerPool(6);
 *   pool.add(() => uploadFile(item));   // returns Promise for this task
 *   await pool.drain();                 // resolves when all tasks finish
 */
export class UploadWorkerPool {
  constructor(concurrency = 6) {
    this._concurrency = concurrency;
    this._running = 0;
    this._queue = [];
    this._drainResolvers = [];
  }

  /**
   * Add a task (an async function) to the pool.
   * Returns a Promise that resolves/rejects with the task result.
   */
  add(task) {
    return new Promise((resolve, reject) => {
      this._queue.push({ task, resolve, reject });
      this._tick();
    });
  }

  /**
   * Returns a Promise that resolves when all currently queued + running tasks finish.
   */
  drain() {
    if (this._running === 0 && this._queue.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this._drainResolvers.push(resolve);
    });
  }

  _tick() {
    while (this._running < this._concurrency && this._queue.length > 0) {
      const { task, resolve, reject } = this._queue.shift();
      this._running++;

      Promise.resolve()
        .then(() => task())
        .then(
          (result) => {
            resolve(result);
            this._running--;
            this._tick();
            this._checkDrain();
          },
          (err) => {
            reject(err);
            this._running--;
            this._tick();
            this._checkDrain();
          }
        );
    }
  }

  _checkDrain() {
    if (this._running === 0 && this._queue.length === 0) {
      const resolvers = this._drainResolvers.splice(0);
      resolvers.forEach((r) => r());
    }
  }
}

/**
 * Exponential backoff retry wrapper.
 * Retries `fn` up to `maxRetries` times with delays: 1s, 2s, 4s...
 * Throws the last error if all retries are exhausted.
 * 
 * @param {() => Promise} fn           - async function to retry
 * @param {number}        maxRetries   - max retry attempts (default: 3)
 * @param {Function}      onRetry      - callback(attempt, delay) called before each retry
 */
export async function withExponentialBackoff(fn, maxRetries = 3, onRetry = null) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        if (onRetry) onRetry(attempt + 1, delayMs);
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}
