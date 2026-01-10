import { UserRepository } from "../repositories/user.repository";
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  UserResponse,
  AuthTokens,
} from "../models/user.model";
import { AuthUtils } from "../utils/auth.utils";
import { AppError } from "../middlewares/error.middleware";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Validate email
    if (!AuthUtils.isValidEmail(data.email)) {
      throw new AppError("Invalid email format", 400);
    }

    // Validate password
    const passwordValidation = AuthUtils.isValidPassword(data.password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message!, 400);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create(data, passwordHash);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Return response
    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(
      data.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    let decoded;
    try {
      decoded = AuthUtils.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    // Check if token exists in database
    const tokenRecord =
      await this.userRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Get user
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Delete old refresh token
    await this.userRepository.deleteRefreshToken(refreshToken);

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await this.userRepository.deleteRefreshToken(refreshToken);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: number): Promise<void> {
    await this.userRepository.deleteAllRefreshTokens(userId);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return this.formatUserResponse(user);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: number,
    email: string
  ): Promise<AuthTokens> {
    const accessToken = AuthUtils.generateAccessToken(userId, email);
    const refreshToken = AuthUtils.generateRefreshToken(userId, email);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.userRepository.saveRefreshToken(userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Format user response (remove sensitive data)
   */
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
    };
  }
}
