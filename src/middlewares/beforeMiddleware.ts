import { Request, Response, NextFunction } from "express";

export const beforeMiddleware =
  ({ apiKey }: { apiKey: string }) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Bypass Metrics
    if (req.baseUrl === "/")
      if (req.method === "POST")
        // support request by @prisma/client/edge
        req.headers["content-type"] = "application/json";

    // auth check
    const token = req.headers.authorization || "";
    if (req.method !== "OPTIONS" && token !== `Bearer ${apiKey}`)
      return res.status(401).end();
    next();
  };
