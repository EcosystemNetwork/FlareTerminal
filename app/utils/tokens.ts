import { Address } from "viem";

export const STABLECOIN_SYMBOLS = ["USDC", "EURC", "NZDT"] as const;
export const TOKEN_SYMBOLS = ["ETH", ...STABLECOIN_SYMBOLS] as const;

export type StablecoinSymbol = (typeof STABLECOIN_SYMBOLS)[number];
export type TokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export type TokenBalances = Record<TokenSymbol, string>;
export type StablecoinBalances = Record<StablecoinSymbol, string>;
export type TokenAddresses = Record<TokenSymbol, Address>;

export const EMPTY_STABLECOIN_BALANCES: StablecoinBalances = {
  USDC: "",
  EURC: "",
  NZDT: "",
};

export const BLOCK_EXPLORER_URL = "https://sepolia.etherscan.io";

export const explorerTxUrl = (txHash: string) =>
  `${BLOCK_EXPLORER_URL}/tx/${txHash}`;

export const truncateAddress = (address: string, prefix = 6, suffix = 4) =>
  `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
