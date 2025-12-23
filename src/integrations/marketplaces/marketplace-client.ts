import { ComponentInfo, MarketplaceMetadata, ListOptions } from '../../types';

export interface MarketplaceClient {
  getMetadata(): Promise<MarketplaceMetadata>;
  listComponents(options?: ListOptions): Promise<ComponentInfo[]>;
  getComponent(name: string): Promise<ComponentInfo>;
  downloadComponent(name: string, targetPath: string): Promise<void>;
  search(query: string, filters?: any): Promise<ComponentInfo[]>;
}
