import { JSONRPC, JSONRPCClient, TypedJSONRPCClient } from "json-rpc-2.0";
import { Methods, PaymasterAndDataRequest } from "./types";

import "dotenv/config";
import { DEFAULT_PORT } from "./constants";
const { PORT } = process.env;

const port = PORT ?? DEFAULT_PORT;

const client: TypedJSONRPCClient<Methods> = new JSONRPCClient((req) => {
  fetch(`http://localhost:${port}/rpc`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(req),
  }).then((response) => {
    if (response.status === 200) {
      // Use client.receive when you received a JSON-RPC response.
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (req.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  });
});

// Use client.notify to make a JSON-RPC notification call.
// By definition, JSON-RPC notification does not respond.
client.notify("log", { message: "Hello, World!" });

// request raw JSON-RPC
// let nextID: number = 0;
// const createID = () => nextID++;
// const jsonRPCRequest: PaymasterAndDataRequest = {
//   jsonrpc: JSONRPC,
//   id: createID(),
//   method: "eth_getPaymasterAndDataSize",
//   params: {
//     userOp: {

//     }
//   },
// };
