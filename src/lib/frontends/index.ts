import { wsFrontend } from "./wsFrontend";
import { httpFrontend } from "./httpFrontend";
import { Protocol } from "../util";
import { Frontend} from "./types";
export const frontendRegistry = new Map<Protocol, Frontend>([
  ["ws", wsFrontend],
  ["http", httpFrontend],
]);
