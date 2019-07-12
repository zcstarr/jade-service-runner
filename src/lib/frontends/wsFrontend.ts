import { Frontend } from "./types";
import http, { Server, IncomingMessage } from "http";
import { WebSocketProxyServer } from "../wsProxyServer";
import { ResponseBus } from "../connection";
import { EventEmitter } from "events";
import WebSocket from "ws";

export const wsFrontend: Frontend = (connectionInfo, connectionBus) => {

    // setup the websocket server with additional handling
    const server = http.createServer();
    const wss = new WebSocketProxyServer({ server: server as Server });

    // handle the upgarde event to start process for underlying service
    wss.on("upgrade", (request, socketID) => {
      const response: ResponseBus = new EventEmitter();
      // handle the response from the underlying service
      response.on("established", (backend) => {
        wss.emit("upgraded", socketID, backend.conn);
      });
      // signal to the connection manager, to open a new connection to underlying service
      connectionBus.emit("establish", { req: request, res: response, type: "ws", id: socketID });
    });

    // Once the external service connection has been establish start accepting connections
    wss.on("connection", (socket: WebSocket, request: IncomingMessage, socketID: string, backend: WebSocket) => {

      backend.on("error", () => {
        socket.close();
      });

      backend.on("close", () => {
        socket.close();
      });

      backend.on("message", (data) => {
        socket.send(data);
      });

      socket.on("message", (data: any) => {
        if (request.url === undefined) {
          return;
        }
        connectionBus.emit("request", { payload: data, protocol: "ws", uri: request.url, conn: backend });
      });

      const response: ResponseBus = new EventEmitter();

      // updates the connection to point to the current client facing websocket
      // this.connectionBus.emit("updateConnection", { req: request, res: response, conn: socket, type: "ws", id: socketID });
      // recieve data to send to dest
    });
    server.listen(connectionInfo.port);
    const teardown = (): Promise<void> => {
     return new Promise((resolve) => {
       server.close(() => {
         resolve();
       });
    });
  };

    return teardown;
};
