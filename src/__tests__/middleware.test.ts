import { describe, expect, test, vi } from "vitest";
import { beforeMiddleware } from "../middlewares/beforeMiddleware";
import { afterMiddleware } from "../middlewares/afterMiddleware";
import { Request, Response } from "express";

describe("beforeMiddleware", () => {
  test("Overwrite the content-type header", () => {
    const req = {
      headers: { authorization: "Bearer custom_key" },
      method: "POST",
    } as Request;
    beforeMiddleware({ apiKey: "custom_key" })(req, {} as Response, () => {});

    expect(req.headers["content-type"]).toBe("application/json");
  });

  test("If the authentication token does not match, return 401", () => {
    const mock = vi.fn().mockReturnValue({ end: () => {} });
    const req = {
      headers: { authorization: "Bearer custom_token" },
      method: "POST",
    } as Request;
    const res = {
      status: mock,
    } as unknown as Response;
    beforeMiddleware({ apiKey: "custom_key" })(req, res, () => {});

    expect(mock).toBeCalledWith(401);
  });

  test("preflight request does not check for an authentication token", () => {
    const mock = vi.fn().mockReturnValue({ end: () => {} });
    const req = {
      headers: { authorization: "Bearer custom_token" },
      method: "OPTIONS",
    } as Request;
    const res = {
      status: mock,
    } as unknown as Response;
    beforeMiddleware({ apiKey: "custom_key" })(req, res, () => {});

    expect(mock).not.toBeCalled();
  });
});

describe("afterMiddleware", () => {
  test("If there are no errors, leave it as it is", () => {
    const mock = vi.fn();
    const res = { send: mock, statusCode: 200 } as unknown as Response;
    afterMiddleware()({} as Request, res, () => {});
    res.send(JSON.stringify({ data: [] }));

    expect(mock).toBeCalledWith(JSON.stringify({ data: [] }));
    expect(res.statusCode).toBe(200);
  });
  test("Rewrite body if body contains errors", () => {
    const mock = vi.fn();
    const res = { send: mock, statusCode: 200 } as unknown as Response;
    afterMiddleware()({} as Request, res, () => {});
    res.send(
      JSON.stringify({ errors: [{ message: "An unexpected error occurred." }] })
    );

    expect(mock).toBeCalledWith(
      JSON.stringify({
        EngineNotStarted: {
          reason: {
            KnownEngineStartupError: {
              msg: "An unexpected error occurred.",
              error_code: "P5006",
            },
          },
        },
      })
    );
    expect(res.statusCode).toBe(400);
  });
});
