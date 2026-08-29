export interface NormalizedProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  directUrl: string | null;
  affiliateUrl: string | null;
}

export interface WatchProviderResponse {
  link: string | null;
  providers: NormalizedProvider[];
}