import { UserOperationStruct } from "@account-abstraction/contracts";
import { BigNumberish, BytesLike } from "ethers";
import {
  JSONRPCErrorResponse,
  JSONRPCRequest,
  JSONRPCSuccessResponse,
} from "json-rpc-2.0";

export type PaymasterAndDataRequestParams = [userOp: UserOperationStruct];

export interface PaymasterAndDataRequest extends JSONRPCRequest {
  params: PaymasterAndDataRequestParams;
}

export interface PaymasterAndDataSuccessResponse
  extends JSONRPCSuccessResponse {
  result: PaymasterAndDataResponseData;
}

export type PaymasterAndDataResponse =
  | PaymasterAndDataSuccessResponse
  | JSONRPCErrorResponse;

export type PaymasterAndDataResponseData = {
  paymasterAndData: BytesLike;
  preVerificationGas: BigNumberish;
  verificationGasLimit: BigNumberish;
  callGasLimit: BigNumberish;
};

export type Methods = {
  pm_sponsorUserOperation(
    request: PaymasterAndDataRequest
  ): Promise<PaymasterAndDataResponse>;
  log(params: { message: string }): void;
};
