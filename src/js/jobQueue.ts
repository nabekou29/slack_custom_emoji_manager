type Job<T> = () => Promise<T>;

interface JabQueueOptions<T, E> {
  concurrency?: number;
  onSuccess?: (result: T) => any;
  onFail?: (e: E) => any;
  onComplete?: () => any;
}

/**
 * ジョブの実行を管理するクラス
 */
export default class JabQueue<T, E = Error> {
  private queue: Job<T>[] = [];

  private runningJobs: number = 0;

  private readonly concurrency: number;

  private readonly onSuccess?: (result: T) => any;

  private readonly onFail?: (e: E) => any;

  private readonly onComplete?: () => any;

  /** コンストラクタ */
  constructor(jobs: Job<T>[], options: JabQueueOptions<T, E>) {
    this.concurrency = options.concurrency ?? Infinity;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
    this.onComplete = options.onComplete;
    this.add(...jobs);
  }

  /** ジョブを追加 */
  add(...jobs: Job<T>[]) {
    this.queue.push(...jobs);
    while (this.length && this.runningJobs < this.concurrency) {
      this.process();
    }
  }

  /** ジョブを取り出す */
  private dequeue() {
    return this.queue.shift();
  }

  /** キューのサイズ */
  private get length() {
    return this.queue.length;
  }

  /** ジョブの実行 */
  private process() {
    const job = this.dequeue();
    this.runningJobs += 1;
    job?.()
      .then((res) => this.onSuccess?.(res))
      .catch((e) => this.onFail?.(e))
      .finally(() => {
        this.runningJobs -= 1;
        this.tryNext();
      });
  }

  /** 次のジョブの実行 */
  private tryNext() {
    while (this.runningJobs < this.concurrency && this.length > 0) {
      this.process();
    }
    if (this.runningJobs === 0 && this.length === 0) {
      this.onComplete?.();
    }
  }
}
