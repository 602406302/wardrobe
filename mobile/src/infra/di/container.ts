// 轻量依赖注入容器:接口 token → 工厂函数
// 业务代码永远用 container.get(TOKEN),不直接 import 实现类
// 切换本地/云端只改 bindings.ts,业务代码零改动

type Factory<T> = () => T;

class Container {
  private bindings = new Map<string, Factory<unknown>>();
  private singletons = new Map<string, unknown>();

  // 每次 get 都新建实例
  bind<T>(token: string, factory: Factory<T>): void {
    this.bindings.set(token, factory);
  }

  // 单例:首次 get 时创建并缓存
  singleton<T>(token: string, factory: Factory<T>): void {
    this.bindings.set(token, () => {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, factory());
      }
      return this.singletons.get(token);
    });
  }

  get<T>(token: string): T {
    const factory = this.bindings.get(token);
    if (!factory) {
      throw new Error(`DI: 未找到 token "${token}" 的绑定`);
    }
    return factory() as T;
  }
}

export const container = new Container();

// 所有接口 token 集中管理,避免拼写错误
export const TOKENS = {
  IClothingRepository: 'IClothingRepository',
  IOutfitRepository: 'IOutfitRepository',
  ITagRepository: 'ITagRepository',
  IAssetStore: 'IAssetStore',
  IAuth: 'IAuth',
  ISyncEngine: 'ISyncEngine',
  IImageProcessor: 'IImageProcessor',
} as const;
