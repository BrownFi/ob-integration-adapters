import type { BasePoolState } from "../../base/BasePoolState";

export interface BrownFiV2PoolState extends BasePoolState {
	kappa: bigint;
	lambda: bigint;
	fee: number;
	token0Decimals: number;
	token1Decimals: number;
	price0: bigint;
	price1: bigint;
	updateFee: bigint;
	updateFeedData: `0x${string}`;
}
