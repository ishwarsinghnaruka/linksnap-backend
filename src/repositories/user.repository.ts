import pool from "../config/database";
import { User, RegisterDTO, RefreshToken } from "../models/user.model";
import { QueryResult } from "pg";

export class UserRepository {
  /**
   * Create new user
   */
  async create(data: RegisterDTO, passwordHash: string): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [data.email.toLowerCase(), passwordHash, data.name || null];

    const result: QueryResult<User> = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1 AND is_active = true
    `;

    const result: QueryResult<User> = await pool.query(query, [
      email.toLowerCase(),
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result: QueryResult<User> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
    `;

    const result = await pool.query(query, [email.toLowerCase()]);
    return result.rows[0].exists;
  }

  /**
   * Update user
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    const query = `
      UPDATE users
      SET 
        name = COALESCE($2, name),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result: QueryResult<User> = await pool.query(query, [id, data.name]);
    return result.rows[0];
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: number): Promise<boolean> {
    const query = `
      UPDATE users
      SET is_active = false
      WHERE id = $1
      RETURNING id
    `;

    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Save refresh token
   */
  async saveRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `;

    await pool.query(query, [userId, token, expiresAt]);
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token = $1 AND expires_at > NOW()
    `;

    const result: QueryResult<RefreshToken> = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Delete refresh token
   */
  async deleteRefreshToken(token: string): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE token = $1
    `;

    await pool.query(query, [token]);
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllRefreshTokens(userId: number): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE user_id = $1
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Clean expired refresh tokens
   */
  async cleanExpiredTokens(): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW()
    `;

    await pool.query(query);
  }
}
