import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../shared/config/index.js';
import { AppError } from '../../shared/middleware/error.js';
import * as userRepo from './user.repository.js';

const SALT_ROUNDS = 10;

export async function register(email: string, password: string, displayName?: string) {
  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.createUser(email, passwordHash, displayName);

  const token = generateToken(user.id, user.email);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function login(email: string, password: string) {
  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user.id, user.email);

  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getProfile(userId: string) {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user, true);
}

export async function updateProfile(
  userId: string,
  data: {
    display_name?: string;
    playing_style?: string[];
    interests?: string[];
    bio?: string;
  }
) {
  const user = await userRepo.updateUserProfile(userId, data);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user, true);
}

export async function updatePrivateData(
  userId: string,
  data: {
    real_name?: string;
    photo_url?: string;
    occupation?: string;
    phone?: string;
  }
) {
  const user = await userRepo.updateUserPrivateData(userId, data);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user, true);
}

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function sanitizeUser(user: any, includePrivate: boolean = false) {
  const publicData = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    playing_style: user.playing_style,
    interests: user.interests,
    bio: user.bio,
    created_at: user.created_at,
  };

  if (includePrivate) {
    return {
      ...publicData,
      real_name: user.real_name,
      photo_url: user.photo_url,
      occupation: user.occupation,
      phone: user.phone,
    };
  }

  return publicData;
}
