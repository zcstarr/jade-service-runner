import StrictEventEmitter from "strict-event-emitter-types/types/src";
import { EventEmitter } from "ws";
import { ResponseEvents, ConnectionEvents, DataResponse, HttpDataResponse, WSDataResponse } from "./connectionManager";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import * as util from "./util";
import { IncomingHttpHeaders } from "http2";
import winston from "winston";
import * as jsonRpcError from "./jsonRpcError";

export type ResponseBus<T extends DataResponse> = StrictEventEmitter<EventEmitter, ResponseEvents<T>>;
export type ConnectionBus = StrictEventEmitter<EventEmitter, ConnectionEvents>;

export const connectionError = (message: string, id: number, reason: string, error: Error, logger: winston.Logger) => {
  logger.error(`message: ${message}, reason: ${reason}, stack: ${error.stack}`);
  return jsonRpcError.error(message, id, { reason });
};

export interface HttpConnectionSpec {
  "type": "http";
  "res": ResponseBus<HttpDataResponse>;
  "req": IncomingMessage;
}

export interface WsConnectionSpec {
  "type": "ws";
  "res": ResponseBus<WSDataResponse>;
  "req": IncomingMessage;
  "id": string;
}

export type ConnectionSpec = HttpConnectionSpec | WsConnectionSpec;

export interface WSConnection {
  type: "ws";
  conn: WebSocket;
  host: "localhost";
}

export interface HttpConnect {
  send(data: any, headers: IncomingHttpHeaders, method: string): Promise<IncomingMessage>;
  respond(data: HttpDataResponse): void;
}

export interface HttpConnection {
  type: "http";
  conn: HttpConnect;
  host: "localhost";
}

export type Connection = WSConnection | HttpConnection;

export interface ConnectionInfo {
  host: "localhost";
  port: number;
  protocol: util.Protocol;
}
