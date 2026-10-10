import type { User } from '../entities/User';

export interface IAuth {
  currentUser(): Promise<User>;
  signIn(email: string, password: string): Promise<User>;     // 云端用
  signInAnonymously(): Promise<User>;                          // 本地用
  signOut(): Promise<void>;
  onAuthChange(cb: (u: User | null) => void): () => void;
}
