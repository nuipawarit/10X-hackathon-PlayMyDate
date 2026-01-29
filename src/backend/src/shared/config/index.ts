import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://playmydate:playmydate123@localhost:5433/playmydate',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6380',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  intimacy: {
    thresholds: {
      realName: 25,
      photo: 45,
      occupation: 65,
      call: 85,
    },
    points: {
      activityComplete: 15,
      messagePerPoint: 2,
    },
  },
};
