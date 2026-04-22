import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "JWT_REFRESH_SECRET",
  "JWT_REFRESH_EXPIRES_IN",
  "NODE_ENV",
];

const validateEnv = () => {
  const missingVars = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("─────────────────────────────────────");
    console.error("Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   → ${varName}`);
    });
    console.error("─────────────────────────────────────");
    console.error("Please check your .env file and try again.");
    process.exit(1);
  }

  console.log("Environment variables validated successfully");
};

const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

export { validateEnv, env };