import { Elysia } from "elysia";

import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";

export const authApp = new Elysia().use(healthRoutes).use(authRoutes);

export type AuthApp = typeof authApp;
