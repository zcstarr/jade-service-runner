import { ConnectionInfo, Connection, ResponseBus } from "../connection";
export type SocketBackend  = (connection: ConnectionInfo) => Promise<Connection>;
export type HttpBackend = (connection: ConnectionInfo, response: ResponseBus) => Promise<Connection>;
export type Backend = SocketBackend | HttpBackend;
