import { Request, Response, NextFunction } from "express";

export const beforeMiddleware =
  ({ apiKey }: { apiKey: string }) =>
  (req: Request, res: Response, next: NextFunction) => {
    // support request by @prisma/client/edge
    if (req.method === "POST") req.headers["content-type"] = "application/json";

    // auth check
    const token = req.headers.authorization || "";
    if (req.method !== "OPTIONS" && token !== `Bearer ${apiKey}`)
      return res.status(401).end();
    next();
  };
