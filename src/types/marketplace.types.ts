/**
 * Marketplace type definitions for AIBox
 */

import { ComponentType, Dependency } from './component.types';

export interface MarketplaceMetadata {
  name: string;
  owner: {
    name: string;
    email?: string;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  plugins: MarketplacePlugin[];
}

export interface MarketplacePlugin {
  name: string;
  source: string | MarketplaceSource;
  description?: string;
  version?: string;
  author?: {
    name: string;
  };
  skills?: string[];
}

export interface MarketplaceSource {
  source: 'github' | 'git' | 'url';
  repo?: string;
  url?: string;
}

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  keywords: string[];
  dependencies?: Dependency[];
  size?: number;
}

export interface ListOptions {
  type?: ComponentType;
  enabled?: boolean;
}

export interface SearchFilters {
  type?: ComponentType;
  keyword?: string;
  author?: string;
}
