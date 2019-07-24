import WebSocket from "ws";
import { WSConnection, ConnectionInfo, ResponseBus, connectionError } from "../connection";
import { WSDataResponse } from "../connectionManager";
import { makeLogger } from "../logging";
const logger = makeLogger("ServiceRunner", "WSbackend");

export const wsBackend = async (connectionInfo: ConnectionInfo, response: ResponseBus<WSDataResponse>): Promise<WSConnection> => {
  return new Promise((resolve) => {
    const { host, port } = connectionInfo;
    const connection = new WebSocket(`ws://${host}:${port}`);
    connection.on("error", (error: Error) => {
      response.emit("error", connectionError(502, "Websocket Error", error, logger));
    });
    connection.on("open", () => {
      resolve({ ...connectionInfo, type: "ws", conn: connection });
    });
  });
};
