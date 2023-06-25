import { Request, Response, NextFunction } from "express";

export const afterMiddleware =
  () => (req: Request, res: Response, next: NextFunction) => {
    const oldSend = res.send;

    res.send = function (json) {
      try {
        const data = JSON.parse(json);
        process.env.NODE_ENV === "production"
          ? undefined
          : console.log("Response\n" + JSON.stringify(data, null, 4));
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
        process.env.NODE_ENV === "production"
          ? undefined
          : console.log("Response\n" + json);
        return res.send(json);
      }
    };

    next();
  };
