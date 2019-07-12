import StrictEventEmitter from "strict-event-emitter-types/types/src";
import { EventEmitter } from "ws";
import { ResponseEvents, ConnectionEvents } from "./connectionManager";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { Response } from "node-fetch";
import WebSocket from "ws";
import * as util from "./util";
import { IncomingHttpHeaders } from "http2";

export type ResponseBus = StrictEventEmitter<EventEmitter, ResponseEvents>;
export type ConnectionBus = StrictEventEmitter<EventEmitter, ConnectionEvents>;

export interface HttpConnectionSpec {
  "type": "http";
  "res": ResponseBus;
  "req": IncomingMessage;
}

export interface WsConnectionSpec {
  "type": "ws";
  "res": ResponseBus;
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
  respond(data: any): void;
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
