// import { JsonRpcProvider, Wallet, getBytes, concat, AbiCoder } from "ethers"; // v6
import { BigNumber, Contract, Wallet, ethers } from "ethers";
import { defaultAbiCoder, hexConcat, arrayify } from "ethers/lib/utils";
import { JSONRPC, JSONRPCRequest } from "json-rpc-2.0";
import {
  UserOperationStruct,
  VerifyingPaymaster,
  VerifyingPaymaster__factory,
  EntryPoint,
  EntryPoint__factory,
} from "@account-abstraction/contracts";
import { BundlerJsonRpcProvider, Constants } from "userop";
import { DEFAULT_SIGNATURE_EXPIRATION, DUMP_SIGNATURE } from "./constants";
import { PaymasterAndDataResponse, PaymasterAndDataRequest } from "./types";

// load ENV
import "dotenv/config";
const {
  NODE_URL,
  BUNDLER_URL,
  PRIVATE_KEY,
  ENTRYPOINT_ADDRESS,
  PAYMASTER_ADDRESS,
  SIGNATURE_EXPIRATION,
} = process.env;

function isValidParam(
  request: JSONRPCRequest
): request is PaymasterAndDataRequest {
  return request.params[0] !== undefined;
}

export async function handlePaymasterAndData(
  request: JSONRPCRequest
): Promise<PaymasterAndDataResponse> {
  console.log("request", request);
  if (isValidParam(request)) {
    const [userOp] = request.params;
    const provider = new BundlerJsonRpcProvider(NODE_URL).setBundlerRpc(
      BUNDLER_URL
    );
    const signer = new Wallet(PRIVATE_KEY, provider);
    // const paymaster: VerifyingPaymaster =
    //   new VerifyingPaymaster__factory().attach(PAYMASTER_ADDRESS);
    // const entryPoint: EntryPoint = new EntryPoint__factory().attach(
    //   ENTRYPOINT_ADDRESS
    // );

    const entryPointAddress =
      ENTRYPOINT_ADDRESS ?? Constants.ERC4337.EntryPoint;
    const paymaster = new Contract(
      PAYMASTER_ADDRESS,
      VerifyingPaymaster__factory.abi,
      provider
    );
    const entryPoint = new Contract(
      entryPointAddress,
      EntryPoint__factory.abi,
      provider
    );

    // get signature validation params
    const sigExpiration = SIGNATURE_EXPIRATION ?? DEFAULT_SIGNATURE_EXPIRATION;
    const currentBlockTimestamp = (await provider.getBlock("latest"))!
      .timestamp;
    const sigExpiredAt = currentBlockTimestamp + sigExpiration;

    // const defaultAbiCoder = AbiCoder.defaultAbiCoder();
    let userOpWithPaymaster: UserOperationStruct = {
      ...userOp,
      preVerificationGas: BigNumber.from(userOp.preVerificationGas)
        .mul(3)
        .toHexString(),
      signature: DUMP_SIGNATURE,
      paymasterAndData: hexConcat([
        paymaster.address,
        defaultAbiCoder.encode(
          ["uint48", "uint48"],
          [sigExpiredAt, currentBlockTimestamp]
        ),
        DUMP_SIGNATURE,
      ]),
    };
    // const estimateOpGas = await provider.send("eth_estimateUserOperationGas", [
    //   userOpWithPaymaster,
    //   entryPointAddress,
    // ]);
    // console.log("eth_estimateUserOperationGas", estimateOpGas);

    // hash `userOp` after append `paymasterAndData` and updated gas values
    const hash = await paymaster.getHash(
      userOpWithPaymaster,
      sigExpiredAt,
      currentBlockTimestamp
    );

    // sign with `verifyingSigner`, then append sig on `paymasterAndData` for validate on-chain
    const sig = await signer.signMessage(arrayify(hash));
    userOpWithPaymaster.paymasterAndData = hexConcat([
      paymaster.address,
      defaultAbiCoder.encode(
        ["uint48", "uint48"],
        [sigExpiredAt, currentBlockTimestamp]
      ),
      sig,
    ]);
    console.log("userOpWithPaymaster:", userOpWithPaymaster);

    // simulate validation on `entryPoint` contract
    // const res = await entryPoint.callStatic
    //   .simulateHandleOp(userOpWithPaymaster, ethers.constants.AddressZero, "0x")
    //   .catch((e) => {
    //     if (e.errorName !== "ValidationResult") {
    //       throw e;
    //     }
    //     return e.errorArgs;
    //   });

    // if (!res.returnInfo.sigFailed) {
    return {
      jsonrpc: JSONRPC,
      id: request.id ?? 0,
      result: {
        paymasterAndData: userOpWithPaymaster.paymasterAndData,
        preVerificationGas: await userOpWithPaymaster.preVerificationGas,
        verificationGasLimit: await userOpWithPaymaster.verificationGasLimit,
        callGasLimit: await userOpWithPaymaster.callGasLimit,
      },
    };
    // } else {
    //   return {
    //     jsonrpc: JSONRPC,
    //     id: request.id ?? 0,
    //     error: {
    //       code: -400,
    //       message: "ValidationFailed",
    //       data: request.params,
    //     },
    //   };
    // }
  } else {
    return {
      jsonrpc: JSONRPC,
      id: request.id ?? 0,
      error: {
        code: -100,
        message: "Params are invalid",
        data: request.params,
      },
    };
  }
}
