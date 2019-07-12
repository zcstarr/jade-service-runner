import WebSocket from "ws";
import { WSConnection, ConnectionInfo } from "../connection";
import { SocketBackend } from "./types";
export const wsBackend = async (connectionInfo: ConnectionInfo): Promise<WSConnection> => {
  return new Promise((resolve) => {
    const { host, port } = connectionInfo;
    const connection = new WebSocket(`ws://${host}:${port}`);
    connection.on("open", () => {
      resolve({ ...connectionInfo, type: "ws", conn: connection });
    });
  });
};
