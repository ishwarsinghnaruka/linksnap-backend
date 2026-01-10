export interface URL {
  id: number;
  short_code: string;
  original_url: string;
  custom_alias: string | null;
  created_at: Date;
  expires_at: Date | null;
  is_active: boolean;
  user_id: number | null;
}

export interface CreateURLDTO {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: Date;
}

export interface URLResponse {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface Click {
  id: number;
  url_id: number;
  clicked_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
}

export interface AnalyticsResponse {
  shortCode: string;
  totalClicks: number;
  clicksByDate: Array<{ date: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  };
}
