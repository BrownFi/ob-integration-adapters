import { describe, expect, test } from "bun:test";
import { parseEther, zeroAddress } from "viem";
import { BrownFiPoolMath } from "./BrownFiPoolMath";

describe("BrownFiPoolMath", () => {
	const Q128 = 1n << 128n;
	const poolMath = new BrownFiPoolMath();
	const poolState = {
		address: zeroAddress,
		token0: zeroAddress,
		token1: zeroAddress,
		reserve0: 100000000000000000000n,
		reserve1: 200000000000000000000n,
		kappa: 2n * Q128,
		oraclePrice: 2n * Q128,
		fee: 25n, // 0.25% fee
	};

	// test("swapExactInput zeroToOne", () => {
	// 	expect(poolMath.swapExactInput(poolState, true, parseEther("1"))).toBe(
	// 		parseEther("1"),
	// 	);
	// });

	// test("swapExactInput oneToZero", () => {
	// 	expect(poolMath.swapExactInput(poolState, false, parseEther("1"))).toBe(
	// 		parseEther("1"),
	// 	);
	// });

	test("swapExactOutput zeroToOne", () => {
		expect(poolMath.swapExactOutput(poolState, true, parseEther("10"))).toBe(
			parseEther("5.277044854881266492"),
		);
	});

	test("swapExactOutput oneToZero", () => {
		expect(poolMath.swapExactOutput(poolState, false, parseEther("10"))).toBe(
			parseEther("22.284122562674094710"),
		);
	});

	// test("spotPriceWithoutFee zeroToOne", () => {
	// 	expect(poolMath.spotPriceWithoutFee(poolState, true)).toBe(1);
	// });

	// test("spotPriceWithoutFee oneToZero", () => {
	// 	expect(poolMath.spotPriceWithoutFee(poolState, false)).toBe(1);
	// });
});
