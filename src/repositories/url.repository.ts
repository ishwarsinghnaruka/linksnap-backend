import pool from "../config/database";
import { URL, CreateURLDTO, Click } from "../models/url.model";
import { QueryResult } from "pg";

export class URLRepository {
  /**
   * Create a new shortened URL
   * Now accepts optional userId
   */
  async create(
    data: CreateURLDTO,
    shortCode: string,
    userId?: number
  ): Promise<URL> {
    const query = `
      INSERT INTO urls (short_code, original_url, custom_alias, expires_at, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      shortCode,
      data.originalUrl,
      data.customAlias || null,
      data.expiresAt || null,
      userId || null,
    ];

    const result: QueryResult<URL> = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all URLs by user ID
   */
  async findByUserId(userId: number): Promise<URL[]> {
    const query = `
      SELECT * FROM urls
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result: QueryResult<URL> = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Find URL by short code
   */
  async findByShortCode(shortCode: string): Promise<URL | null> {
    const query = `
      SELECT * FROM urls
      WHERE short_code = $1 AND is_active = true
    `;

    const result: QueryResult<URL> = await pool.query(query, [shortCode]);
    return result.rows[0] || null;
  }

  /**
   * Find URL by custom alias
   */
  async findByCustomAlias(alias: string): Promise<URL | null> {
    const query = `
      SELECT * FROM urls
      WHERE custom_alias = $1 AND is_active = true
    `;

    const result: QueryResult<URL> = await pool.query(query, [alias]);
    return result.rows[0] || null;
  }

  /**
   * Find URL by ID
   */
  async findById(id: number): Promise<URL | null> {
    const query = `
      SELECT * FROM urls
      WHERE id = $1
    `;

    const result: QueryResult<URL> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Check if short code exists
   */
  async existsByShortCode(shortCode: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT 1 FROM urls WHERE short_code = $1)
    `;

    const result = await pool.query(query, [shortCode]);
    return result.rows[0].exists;
  }

  /**
   * Check if custom alias exists
   */
  async existsByCustomAlias(alias: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT 1 FROM urls WHERE custom_alias = $1)
    `;

    const result = await pool.query(query, [alias]);
    return result.rows[0].exists;
  }

  /**
   * Delete URL by short code (soft delete)
   */
  async deleteByShortCode(shortCode: string): Promise<boolean> {
    const query = `
      UPDATE urls
      SET is_active = false
      WHERE short_code = $1
      RETURNING id
    `;

    const result = await pool.query(query, [shortCode]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get all URLs (for future: add pagination)
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<URL[]> {
    const query = `
      SELECT * FROM urls
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result: QueryResult<URL> = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Check if URL has expired
   */
  async isExpired(url: URL): Promise<boolean> {
    if (!url.expires_at) return false;
    return new Date(url.expires_at) < new Date();
  }
}
