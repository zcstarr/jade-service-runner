export type StringWxzVcTo3 = string;
export type StringFek9G2ZM = "all" | "running" | "available" | "installed";
export type BooleanQg3XFxa5 = boolean;
export interface ObjectDBzoJtf4 {
  name: StringWxzVcTo3;
  summary?: StringWxzVcTo3;
  [k: string]: any;
}
export type ArrayFWi9QNmP = ObjectDBzoJtf4[];
export type StringTLqBBstC = "active" | "available" | "installed";
export interface ObjectT84Ta8SE {
  name?: StringWxzVcTo3;
  version?: StringWxzVcTo3;
  environments: ArrayFWi9QNmP;
  state?: StringTLqBBstC;
  [k: string]: any;
}
export type ArrayB39Fjis6 = ObjectT84Ta8SE[];
export interface ObjectVZsrKceH {
  name?: StringWxzVcTo3;
  version?: StringWxzVcTo3;
  [k: string]: any;
}
export type ArrayKvcc3Slb = ObjectVZsrKceH[];
export type ArrayFoEQPbEQ = StringWxzVcTo3[];
export interface ObjectD8RkBGZG {
  cmd: StringWxzVcTo3;
  args: ArrayFoEQPbEQ;
  [k: string]: any;
}
export type ArrayQfe0DQgu = ObjectD8RkBGZG[];
export interface ObjectHuetvW0J {
  setup: ArrayQfe0DQgu;
  start: StringWxzVcTo3;
  stop: StringWxzVcTo3;
  teardown: StringWxzVcTo3;
  [k: string]: any;
}
export interface ObjectHqcFUS7M {
  start: ArrayFoEQPbEQ;
  stop: ArrayFoEQPbEQ;
  teardown: ArrayFoEQPbEQ;
  [k: string]: any;
}
/**
 * An object that describes an instance of a service
 */
export interface ObjectDLZvXzsu {
  env: StringWxzVcTo3;
  rpcPort: StringWxzVcTo3;
  name: StringWxzVcTo3;
  version: StringWxzVcTo3;
  path: StringWxzVcTo3;
  commands: ObjectHuetvW0J;
  args: ObjectHqcFUS7M;
  state?: StringWxzVcTo3;
  [k: string]: any;
}
export type ArrayZUy9Ik8E = ObjectDLZvXzsu[];
export type InstallService = (serviceName: StringWxzVcTo3, version: StringWxzVcTo3) => Promise<BooleanQg3XFxa5>;
export type ListServices = (filter: StringFek9G2ZM) => Promise<ArrayB39Fjis6>;
export type ListInstalledServices = () => Promise<ArrayKvcc3Slb>;
export type ListRunningServices = () => Promise<ArrayZUy9Ik8E>;
export type StartService = (name: StringWxzVcTo3, version: StringWxzVcTo3, environment: StringWxzVcTo3) => Promise<ObjectDLZvXzsu>;
