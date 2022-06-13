import { Request, Response, NextFunction } from "express";

export const authenticate =
  (authToken: string) => (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization || "";
    if (req.method !== "OPTIONS" && token !== `Bearer ${authToken}`)
      return res.status(401).end();
    next();
  };
