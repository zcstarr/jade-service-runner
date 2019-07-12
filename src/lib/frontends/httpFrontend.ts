import { Frontend } from "./types";
import http, { Server, IncomingMessage } from "http";
import { ResponseBus } from "../connection";
import { EventEmitter } from "events";
import connect from "connect";
import { json as jsonParser } from "body-parser";
import { makeLogger } from "../logging";
const logger = makeLogger("ServiceRunner", "httpFrontend");
export const httpFrontend: Frontend = (connectionInfo, connectionBus) => {

  const app = connect();
  app.use(jsonParser());
  const proxy = (req: any, response: http.ServerResponse) => {
    const responseBus: ResponseBus = new EventEmitter();
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
        connectionBus.emit("request", { payload: {headers, method, body}, protocol: "http", uri: req.url, conn: backend.conn });
      }
    });
    logger.debug(`requesting connection be established`);
    connectionBus.emit("establish", { req, res: responseBus, type: "http" });
    responseBus.on("response", (data) => {
      logger.debug(`received response`);
      response.write(data);
      response.end(null);
    });
  };
  app.use(proxy);
  // setup the websocket server with additional handling
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
