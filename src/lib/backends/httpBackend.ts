import WebSocket from "http";
import fetch, {Headers } from "node-fetch";
import { HttpConnection, ConnectionInfo, ResponseBus } from "../connection";
import http from "http";
import { makeLogger } from "../logging";
import { HttpBackend } from "./types";
const logger = makeLogger("ServiceRunner", "HttpBackend");
export const httpBackend = async (connectionInfo: ConnectionInfo, response: ResponseBus): Promise<HttpConnection> => {
    const { host, port } = connectionInfo;
    const send = (data: any , headers: http.IncomingHttpHeaders, method: string): Promise<http.IncomingMessage> => {
      return new Promise((resolve) => {
        logger.debug(`making request to backend on port ${port} with ${JSON.stringify(data)}`);
        const request = http.request(`http://${host}:${port}/`, {
          headers,
          method,
        }, (res) => {
          logger.debug(`returning a response`);
          resolve(res);
        });
        request.write(JSON.stringify(data));
        request.end();
      });
  };
    const respond = (data: any) => {
    response.emit("response", data);
  };
    return {
    ...connectionInfo,
    type: "http",
    conn: {
      send,
      respond,
    },
  };
};
