import ICachingProvider from './ICachingProvider';

export class NullCachingProvider implements ICachingProvider {
  constructor() {}

  async hasCache(url: string): Promise<boolean> {
    return false;
  }

  async getCache(url: string): Promise<string> {
    return null;
  }

  async saveCache(url: string, data: string): Promise<void> {}
}
