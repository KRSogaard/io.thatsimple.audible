export default interface ICachingProvider {
  hasCache(url: string): Promise<boolean>;
  getCache(url: string): Promise<string | null>;
  saveCache(url: string, data: string): Promise<void>;
}
