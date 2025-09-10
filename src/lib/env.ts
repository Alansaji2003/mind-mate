import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    HF_API_KEY:z.string().min(1),
    MODEL_URL:z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_APPWRITE_PROJECT_NAME: z.string().min(1),
    NEXT_PUBLIC_APPWRITE_ENDPOINT: z.url(),
    NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION: z.string().min(1),
    NEXT_PUBLIC_APPWRITE_DB_ID: z.string().min(1),
    NEXT_PUBLIC_APP_URL:z.url(),

    
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APPWRITE_PROJECT_ID:
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    NEXT_PUBLIC_APPWRITE_PROJECT_NAME:
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME,
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION:
      process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
    NEXT_PUBLIC_APPWRITE_DB_ID: process.env.NEXT_PUBLIC_APPWRITE_DB_ID,
    NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL
    
  },
});
