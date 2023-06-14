import {
  JSONRPCErrorResponse,
  JSONRPCID,
  JSONRPCServer,
  TypedJSONRPCServer,
  createJSONRPCErrorResponse,
} from "json-rpc-2.0";
import express from "express";
import bodyParser from "body-parser";

import { Methods } from "./types";
import { handlePaymasterAndData } from "./handlers";

import { DEFAULT_PORT } from "./constants";
import "dotenv/config";
const { PORT } = process.env;
const port = PORT ?? DEFAULT_PORT;

// use Middleware
const app = express();
app.use(bodyParser.json());

// Types are infered from the Methods type
const server: TypedJSONRPCServer<Methods> = new JSONRPCServer();
server.addMethodAdvanced("pm_sponsorUserOperation", handlePaymasterAndData);
// server.addMethod("eth_getPaymasterAndDataSize", handlePaymasterAndData);
server.addMethod("log", console.log);

server.mapErrorToJSONRPCErrorResponse = (
  id: JSONRPCID,
  error: any
): JSONRPCErrorResponse => {
  return createJSONRPCErrorResponse(
    id,
    error?.code || 0,
    error?.message || "An unexpected error occurred"
  );
};

app.post("/rpc", (req, res) => {
  const jsonRPCRequest = req.body;
  // server.receive takes a JSON-RPC request and returns a promise of a JSON-RPC response.
  // It can also receive an array of requests, in which case it may return an array of responses.
  // Alternatively, you can use server.receiveJSON, which takes JSON string as is (in this case req.body).
  server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse);
    } else {
      // If response is absent, it was a JSON-RPC notification method.
      // Respond with no content status (204).
      res.sendStatus(204);
    }
  });
});

app.listen(port);

console.log(`JSON-RPC server is listening on http://localhost:${port}/rpc`);
