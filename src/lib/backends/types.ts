import { ConnectionInfo, Connection, ResponseBus } from "../connection";
import { HttpDataResponse } from "../connectionManager";
export type SocketBackend  = (connection: ConnectionInfo) => Promise<Connection>;
export type HttpBackend = (connection: ConnectionInfo, response: ResponseBus<HttpDataResponse>) => Promise<Connection>;
export type Backend = SocketBackend | HttpBackend;
