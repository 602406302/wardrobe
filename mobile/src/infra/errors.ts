// 云端/同步预留功能未实现时抛出
export class NotImplementedError extends Error {
  constructor(message = '此功能待开发') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

// Repository 层错误基类
export class RepositoryError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
  }
}
