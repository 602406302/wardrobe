// 云端账号占位(未来用 Supabase Auth)
import type { IAuth } from '../../../domain/repositories/IAuth';
import type { User } from '../../../domain/entities/User';
import { NotImplementedError } from '../../../infra/errors';

export class SupabaseAuth implements IAuth {
  currentUser(): Promise<User> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  signIn(_email: string, _password: string): Promise<User> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  signInAnonymously(): Promise<User> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  signOut(): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  onAuthChange(_cb: (u: User | null) => void): () => void {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
}
