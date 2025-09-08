import { Client, Databases, ID } from "appwrite";
import { env } from "@/lib/env";

export const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export { ID };
