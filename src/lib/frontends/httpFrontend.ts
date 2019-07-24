import { Frontend } from "./types";
import http, { Server, IncomingMessage } from "http";
import { ResponseBus, ConnectionBus } from "../connection";
import { EventEmitter } from "events";
import connect from "connect";
import { json as jsonParser } from "body-parser";
import { makeLogger } from "../logging";
import { HttpDataResponse, DataError } from "../connectionManager";
const logger = makeLogger("ServiceRunner", "httpFrontend");

const httpClientError = (dataError: DataError, response: http.ServerResponse) => {
      response.setHeader("content-type", "application/json");
      response.writeHead(200);
      const { message } = dataError.error;
 //     response.write(JSON.stringify({error: { code: -32700, message: "haha", data: 2 }, ));
      response.write(JSON.stringify({ "jsonrpc": "2.0", "error": { "code": -32600, "message": "Invalid Request" }, "id": null }));
      response.end(null);
};

const httpProxy = (connectionBus: ConnectionBus) => {
  return (req: any, response: http.ServerResponse) => {
    const responseBus: ResponseBus<HttpDataResponse> = new EventEmitter();

    responseBus.on("terminateConnection", (dataError) => {
      httpClientError(dataError, response);
    });

    responseBus.on("error", (dataError) => {
      httpClientError(dataError, response);
    });

    responseBus.on("established", async (backend) => {
      if (backend.type === "http") {
        logger.debug(`established http connection`);
        if (req.url === undefined) {
          response.writeHead(400);
          response.end(null);
          return;
        }
        const { headers, method, body } = req;
        logger.debug(`forwarding request ${headers} ${method} ${JSON.stringify(body)}`);
        connectionBus.emit("request", { payload: { headers, method, body }, protocol: "http", uri: req.url, conn: backend.conn });
      }
    });

    logger.debug(`Requesting connection be established`);
    connectionBus.emit("establish", { req, res: responseBus, type: "http" });

    responseBus.on("response", (data) => {
      logger.debug(`received response: ${JSON.stringify(data, null, 2)}`);
      const statusCode = data.statusCode || 500;
      response.writeHead(statusCode, data.reason, data.headers);
      response.write(data.payload);
      response.end(null);
    });
  };

};

export const httpFrontend: Frontend = (connectionInfo, connectionBus) => {
  const app = connect();
  app.use(jsonParser());
  app.use(httpProxy(connectionBus));
  const server = http.createServer(app);
  server.listen(connectionInfo.port);
  logger.debug(`listening on ${connectionInfo.port}`);
  const teardown = (): Promise<void> => {
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  };
  return teardown;
};
