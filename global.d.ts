namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    NODE_URL?: string;
    BUNDLER_URL?: string;
    PORT?: number;
    PRIVATE_KEY: string;
    ENTRYPOINT_ADDRESS?: string;
    PAYMASTER_ADDRESS: string;
    SIGNATURE_EXPIRATION?: number;
  }
}
