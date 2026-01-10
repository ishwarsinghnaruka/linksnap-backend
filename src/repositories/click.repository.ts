import pool from "../config/database";
import { Click } from "../models/url.model";
import { QueryResult } from "pg";

export interface ClickData {
  urlId: number;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  deviceType?: string;
}

export interface ClicksByDate {
  date: string;
  clicks: number;
}

export interface ClicksByCountry {
  country: string;
  clicks: number;
}

export interface ClicksByDevice {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
}

export class ClickRepository {
  /**
   * Record a click event
   */
  async create(data: ClickData): Promise<Click> {
    const query = `
      INSERT INTO clicks (
        url_id, 
        ip_address, 
        user_agent, 
        referrer, 
        country, 
        city, 
        device_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      data.urlId,
      data.ipAddress || null,
      data.userAgent || null,
      data.referrer || null,
      data.country || null,
      data.city || null,
      data.deviceType || null,
    ];

    const result: QueryResult<Click> = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get total clicks for a URL
   */
  async getTotalClicks(urlId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM clicks
      WHERE url_id = $1
    `;

    const result = await pool.query(query, [urlId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get clicks grouped by date (last 30 days)
   */
  async getClicksByDate(
    urlId: number,
    days: number = 30
  ): Promise<ClicksByDate[]> {
    const query = `
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM clicks
      WHERE url_id = $1
        AND clicked_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [urlId]);
    return result.rows.map((row) => ({
      date: row.date,
      clicks: parseInt(row.clicks),
    }));
  }

  /**
   * Get clicks grouped by country
   */
  async getClicksByCountry(urlId: number): Promise<ClicksByCountry[]> {
    const query = `
      SELECT 
        COALESCE(country, 'Unknown') as country,
        COUNT(*) as clicks
      FROM clicks
      WHERE url_id = $1
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [urlId]);
    return result.rows.map((row) => ({
      country: row.country,
      clicks: parseInt(row.clicks),
    }));
  }

  /**
   * Get clicks grouped by device type
   */
  async getClicksByDevice(urlId: number): Promise<ClicksByDevice> {
    const query = `
      SELECT 
        device_type,
        COUNT(*) as clicks
      FROM clicks
      WHERE url_id = $1
      GROUP BY device_type
    `;

    const result = await pool.query(query, [urlId]);

    const deviceStats: ClicksByDevice = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    };

    result.rows.forEach((row) => {
      const deviceType = (row.device_type || "other").toLowerCase();
      const clicks = parseInt(row.clicks);

      if (deviceType === "mobile") {
        deviceStats.mobile = clicks;
      } else if (deviceType === "desktop") {
        deviceStats.desktop = clicks;
      } else if (deviceType === "tablet") {
        deviceStats.tablet = clicks;
      } else {
        deviceStats.other += clicks;
      }
    });

    return deviceStats;
  }

  /**
   * Get recent clicks (last N clicks)
   */
  async getRecentClicks(urlId: number, limit: number = 10): Promise<Click[]> {
    const query = `
      SELECT *
      FROM clicks
      WHERE url_id = $1
      ORDER BY clicked_at DESC
      LIMIT $2
    `;

    const result: QueryResult<Click> = await pool.query(query, [urlId, limit]);
    return result.rows;
  }
}
