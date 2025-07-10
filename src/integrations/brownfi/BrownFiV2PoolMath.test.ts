import { describe, expect, test } from "bun:test";
import { parseEther, zeroAddress } from "viem";
import { BrownFiV2PoolMath } from "./BrownFiV2PoolMath";
import type { BrownFiV2PoolState } from "./BrownFiV2PoolState";

describe("BrownFiV2PoolMath", () => {
	const Q64 = 1n << 64n;
	const poolMath = new BrownFiV2PoolMath();
	const poolState: BrownFiV2PoolState = {
		address: zeroAddress,
		token0: zeroAddress,
		token1: zeroAddress,
		token0Decimals: 18,
		token1Decimals: 18,
		reserve0: 100000000000000000000n,
		reserve1: 200000000000000000000n,
		kappa: 2n * Q64,
		price0: 2n * Q64,
		price1: 1n * Q64,
		fee: 250000, // 0.25% fee
		lambda: 0n, // No skewness adjustment
		updateFee: 0n,
		updateFeedData: "0x",
	};

	test("swapExactInput zeroToOne", () => {
		expect(poolMath.swapExactInput(poolState, true, parseEther("10"))).toBe(
			parseEther("18.140589569160997731"),
		);
	});

	test("swapExactInput oneToZero", () => {
		expect(poolMath.swapExactInput(poolState, false, parseEther("10"))).toBe(
			parseEther("4.750593824228028503"),
		);
	});

	test("swapExactOutput zeroToOne", () => {
		expect(poolMath.swapExactOutput(poolState, true, parseEther("10"))).toBe(
			parseEther("5.276315789473684210"),
		);
	});

	test("swapExactOutput oneToZero", () => {
		expect(poolMath.swapExactOutput(poolState, false, parseEther("10"))).toBe(
			parseEther("22.277777777777777776"),
		);
	});

	test("spotPriceWithoutFee zeroToOne", () => {
		expect(poolMath.spotPriceWithoutFee(poolState, true)).toBe(2);
	});

	test("spotPriceWithoutFee oneToZero", () => {
		expect(poolMath.spotPriceWithoutFee(poolState, false)).toBe(0.5);
	});
});
