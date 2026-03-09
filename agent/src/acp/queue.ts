export class QueueFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueFullError";
  }
}

interface PendingTask {
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

export class TaskQueue {
  private readonly pending: PendingTask[] = [];
  private running = 0;

  constructor(
    private readonly label: string,
    private readonly concurrency: number,
    private readonly maxDepth: number,
  ) {}

  get size(): number {
    return this.running + this.pending.length;
  }

  snapshot(): { label: string; concurrency: number; running: number; pending: number; maxDepth: number } {
    return {
      label: this.label,
      concurrency: this.concurrency,
      running: this.running,
      pending: this.pending.length,
      maxDepth: this.maxDepth,
    };
  }

  enqueue<T>(run: () => Promise<T>): Promise<T> {
    if (this.size >= this.maxDepth) {
      throw new QueueFullError(`${this.label} queue is full. Please retry later.`);
    }

    return new Promise<T>((resolve, reject) => {
      this.pending.push({
        run,
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.flush();
    });
  }

  private flush(): void {
    while (this.running < this.concurrency && this.pending.length > 0) {
      const task = this.pending.shift() as PendingTask;
      this.running += 1;

      task
        .run()
        .then((value) => task.resolve(value))
        .catch((error) => task.reject(error))
        .finally(() => {
          this.running -= 1;
          this.flush();
        });
    }
  }
}
