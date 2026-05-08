import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error({ error }, "Supabase auth error");
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
    };

    next();
  } catch (err) {
    logger.error({ err }, "Unexpected auth error");
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};
