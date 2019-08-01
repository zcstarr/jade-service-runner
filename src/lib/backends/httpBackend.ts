import { HttpConnection, ConnectionInfo, ResponseBus, connectionError } from "../connection";
import http from "http";
import * as jsonRpcErrors from "../jsonRpcError";
import { makeLogger } from "../logging";
import { HttpDataResponse } from "../connectionManager";
const logger = makeLogger("ServiceRunner", "HttpBackend");
export const httpBackend = async (connectionInfo: ConnectionInfo, response: ResponseBus<HttpDataResponse>): Promise<HttpConnection> => {
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
        request.on("error", (err) => {
          let id = 0;
          // NOTE a client bug does not support null id on error
          if (data) {
            id = data.id || 0;
          }
          response.emit("error", connectionError(jsonRpcErrors.GATEWAY_ERROR, id, "Request failure", err, logger));
          resolve();
        });
        request.write(JSON.stringify(data));
        request.end();
      });
  };
    const respond = (data: HttpDataResponse) => {
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
