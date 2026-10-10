// 全局配置:云端开关、抠图开关、业务参数
export const config = {
  // 云端(本阶段不启用,占位)
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  cloudEnabled: false,                // 总开关,本阶段 false
  syncEnabled: false,                 // 同步开关,本阶段 false
  // 抠图
  bgRemovalEnabled: true,
  // 业务
  maxBatchCapture: 9,
  thumbSize: 256,
} as const;
