# 云端实现(data/remote/)

> **本阶段不开发,只预留空壳类**。所有方法抛 `NotImplementedError`。
> 未来接云端时,在此目录下实现 Supabase 版本,并在 `infra/di/bindings.ts` 切换绑定。

## 本阶段产出

- `supabase/SupabaseClothingRepository.ts` — 抛 NotImplementedError
- `supabase/SupabaseTagRepository.ts` — 抛 NotImplementedError
- `supabase/SupabaseOutfitRepository.ts` — 抛 NotImplementedError
- `supabase/SupabaseAssetStore.ts` — 抛 NotImplementedError
- `supabase/SupabaseAuth.ts` — 抛 NotImplementedError
- `client.ts` — TODO 占位

## 未来实现路径(开发时照此执行)

### 1. 选型:Supabase(开源 BaaS)
- Auth + Postgres + Storage 一套搞定
- 免费额度够个人项目,可自托管
- Postgres 与本地 Drizzle schema 几乎一致

### 2. 建表
直接复用 `data/local/db/schema.ts`,字段名转 snake_case。
同步字段(id / created_at / updated_at / deleted_at / version / owner_id)原样保留。

### 3. 启用 RLS(Row Level Security)
每条数据 `owner_id = auth.uid()`,确保用户只能访问自己的数据。

```sql
ALTER TABLE clothings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能看自己的衣物"
  ON clothings FOR SELECT
  USING (owner_id = auth.uid());
-- 同理对 INSERT/UPDATE/DELETE 建策略
```

### 4. 图片用 Supabase Storage
- bucket: `wardrobe`(私有)
- 路径: `{userId}/originals/{uuid}.png`
- `SupabaseAssetStore.save()` 上传,`getPublicUrl()` 返回签名 URL

### 5. Auth 用 Supabase Auth
- 邮箱/手机号/OAuth 皆可
- `SupabaseAuth.signIn()` 调 `supabase.auth.signInWithPassword()`
- `onAuthChange()` 监听 `supabase.auth.onAuthStateChange()`

### 6. 切换 DI 绑定
在 `infra/di/bindings.ts`:
```ts
container.singleton(TOKENS.IClothingRepository, () => new SupabaseClothingRepository());
container.singleton(TOKENS.IOutfitRepository, () => new SupabaseOutfitRepository());
container.singleton(TOKENS.ITagRepository, () => new SupabaseTagRepository());
container.singleton(TOKENS.IAssetStore, () => new SupabaseAssetStore());
container.singleton(TOKENS.IAuth, () => new SupabaseAuth());
container.singleton(TOKENS.ISyncEngine, () => new SupabaseSyncEngine());
```
**业务代码零改动**——这就是分层 + DI 的价值。

### 7. 同步引擎
见 `sync/README.md`。
