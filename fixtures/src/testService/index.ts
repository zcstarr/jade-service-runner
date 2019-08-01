import { testServer } from "./server";
import { SimpleMath} from "./client";
import ws from "isomorphic-ws";
import program, { Command } from "commander";
program
  .option(
    "-p, --port <port>",
    "Set port for simple math",
    "8900",
  )
  .option(
    "-m, --mode <mode>",
    "Set protocol for simple math ws, wss, http, https",
    "ws",
  )
  .action(async () => {
    const port = parseInt(program.port, 10);
    const server = testServer(port, program.mode, SimpleMath.openrpcDocument, {});
    console.log(`simplemath test server starting with ${program.mode} - ${program.port}` );
    server.start();
    console.log("simplemath test server started");
  })
  .parse(process.argv);
/*
const sm = new SimpleMath({
  transport: {
    host: "localhost",
    port: 8900,
    type: "websocket",
  },
});

const foo = async () => {
  /*const cl = new ws("ws://localhost:8900/");
  cl.on("open", () => {
    console.log("yessir");
  });

  try {
    await sm.transport.connect();
    const result = await sm.addition(2, 2);
    console.log(result);
  } catch (e) {
    console.log("error");
    console.log(e);
  }
};
console.log("foo it");
foo();
console.log("food it");
*/
