import { Request, Response, NextFunction } from "express";

export const customError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const oldSend = res.send;

  res.send = function (json) {
    try {
      const data = JSON.parse(json);
      const message = data.errors?.[0]?.message;
      res.send = oldSend;
      if (message) {
        res.statusCode = 400;
        return res.send(
          JSON.stringify({
            EngineNotStarted: {
              reason: {
                KnownEngineStartupError: {
                  msg: message,
                  error_code: "P5006",
                },
              },
            },
          })
        );
      }
      return res.send(json);
    } catch {
      res.send = oldSend;
      return res.send(json);
    }
  };

  next();
};
