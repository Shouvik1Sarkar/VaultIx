import dotenv from "dotenv";

dotenv.config({
  path: `./.env.${process.env.NODE_ENV ?? "development"}.local`,
});

export const {
  // PORT
  PORT,
  // MONGODB url
  MONGODB_URL,
  MONGODB_TEST_URL,
  // JWT/ACCESS TOKEN variables
  JWT_EXPIRES_IN,
  JWT_SECRET,
  // refresh token variables
  REFRESH_TOKEN_EXPIRES,
  REFRESH_TOKEN_SECRET,
  // mail trap variables
  MAILTRAP_HOST,
  MAILTRAP_PASSWORD,
  MAILTRAP_PORT,
  MAILTRAP_USERNAME,
  // cloudinary variables
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_KEY,
  CLOUDINARY_CLOUD_SECRET,
  ARCJET_KEY,
  ARCJET_ENV,

  //redis url
  REDIS_URL,
  REDIS_PASSWORD,
} = process.env;
