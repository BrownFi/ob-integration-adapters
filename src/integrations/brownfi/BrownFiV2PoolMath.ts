import { BasePoolMath } from "../../base/BasePoolMath";
import type { BrownFiV2PoolState } from "./BrownFiV2PoolState";

export class BrownFiV2PoolMath extends BasePoolMath<BrownFiV2PoolState> {
	private PRECISION = 100000000n; // 10^8
	private DECIMALS = 18n;
	// Q64 constant as bigint (2^64)
	private Q64 = 1n << 64n;

	/**
	 * @dev The function is expected to fetch the latest pool state on each call.
	 * Based on BrownFiV2Library.getAmountOut
	 */
	override swapExactInput(
		pool: BrownFiV2PoolState,
		zeroToOne: boolean,
		amountIn: bigint,
	): bigint {
		if (amountIn <= 0n)
			throw new Error("BrownFiV2Library: INSUFFICIENT_INPUT_AMOUNT");

		// Extract reserves and parameters from pool state
		const [reserveIn, reserveOut] = zeroToOne
			? [pool.reserve0, pool.reserve1]
			: [pool.reserve1, pool.reserve0];
		
		const [tokenInDecimals, tokenOutDecimals] = zeroToOne
			? [pool.token0Decimals, pool.token1Decimals]
			: [pool.token1Decimals, pool.token0Decimals];

		if (reserveOut <= 0n)
			throw new Error("BrownFiV2Library: INSUFFICIENT_LIQUIDITY");

		// Parse raw amounts to default decimals (18)
		const parsedAmountIn = this.parseRawToDefaultDecimals(tokenInDecimals, amountIn);
		const parsedReserveOut = this.parseRawToDefaultDecimals(tokenOutDecimals, reserveOut);

		// Get prices with skewness adjustment
		const [priceIn, priceOut] = this.getSkewnessPrice(
			zeroToOne ? pool.price0 : pool.price1,
			zeroToOne ? pool.price1 : pool.price0,
			this.parseRawToDefaultDecimals(pool.token0Decimals, pool.reserve0),
			this.parseRawToDefaultDecimals(pool.token1Decimals, pool.reserve1),
			pool.lambda
		);

		// Apply fee to amount in
		const _amountIn = this.mulDiv(parsedAmountIn, this.PRECISION, this.PRECISION + BigInt(pool.fee));

		let amountOut: bigint;

		if (pool.kappa === 2n * this.Q64) {
			// Constant product formula
			amountOut = this.mulDiv(
				parsedReserveOut * _amountIn,
				priceIn,
				priceOut * parsedReserveOut + _amountIn * priceIn
			);
		} else {
			// Complex formula using square root
			const leftNumerator = this.computeLeftNumerator(_amountIn, priceIn, priceOut, parsedReserveOut);
			const leftSqrt = this.computeLeftSqrt(_amountIn, priceIn, priceOut, parsedReserveOut);
			const rightSqrt = this.computeRightSqrt(_amountIn, priceIn, priceOut, parsedReserveOut, pool.kappa);
			const denominator = this.mulDiv(priceOut, 2n * this.Q64 - pool.kappa, this.Q64);

			const sqrtTerm = this.sqrt(leftSqrt + rightSqrt);
			amountOut = (leftNumerator - this.Q64 * sqrtTerm) / denominator;
		}

		// Parse default decimals back to raw
		return this.parseDefaultDecimalsToRaw(tokenOutDecimals, amountOut);
	}

	/**
	 * @dev The function is expected to fetch the latest pool state on each call.
	 * Based on BrownFiV2Library.getAmountIn
	 */
	override swapExactOutput(
		pool: BrownFiV2PoolState,
		zeroToOne: boolean,
		amountOut: bigint,
	): bigint {
		if (amountOut <= 0n)
			throw new Error("BrownFiV2Library: INSUFFICIENT_OUTPUT_AMOUNT");

		// Extract reserves and parameters from pool state
		const [reserveIn, reserveOut] = zeroToOne
			? [pool.reserve0, pool.reserve1]
			: [pool.reserve1, pool.reserve0];
		
		const [tokenInDecimals, tokenOutDecimals] = zeroToOne
			? [pool.token0Decimals, pool.token1Decimals]
			: [pool.token1Decimals, pool.token0Decimals];

		if (reserveOut <= 0n)
			throw new Error("BrownFiV2Library: INSUFFICIENT_LIQUIDITY");
		
		// Check max 80% of reserve constraint
		if (amountOut * 10n >= reserveOut * 8n) {
			throw new Error("BrownFiV2Library: MAX_80_PERCENT_OF_RESERVE");
		}

		// Parse to default decimals
		const parsedAmountOut = this.parseRawToDefaultDecimals(tokenOutDecimals, amountOut);
		const parsedReserveOut = this.parseRawToDefaultDecimals(tokenOutDecimals, reserveOut);

		// Get prices with skewness adjustment
		const [priceIn, priceOut] = this.getSkewnessPrice(
			zeroToOne ? pool.price0 : pool.price1,
			zeroToOne ? pool.price1 : pool.price0,
			this.parseRawToDefaultDecimals(pool.token0Decimals, pool.reserve0),
			this.parseRawToDefaultDecimals(pool.token1Decimals, pool.reserve1),
			pool.lambda
		);

		// Calculate price impact: R = (K * dx) / (x - dx)
		const priceImpact = this.mulDiv(
			pool.kappa * this.Q64,
			parsedAmountOut,
			this.Q64 * (parsedReserveOut - parsedAmountOut)
		);

		// Calculate amount in based on price impact
		let amountIn = this.mulDiv(
			parsedAmountOut,
			this.mulDiv(priceOut, priceImpact + this.Q64 * 2n, priceIn),
			this.Q64 * 2n
		);

		// Apply fee
		amountIn = this.mulDiv(amountIn, this.PRECISION + BigInt(pool.fee), this.PRECISION);

		// Parse default decimals to raw
		return this.parseDefaultDecimalsToRaw(tokenInDecimals, amountIn);
	}

	override spotPriceWithoutFee(
		pool: BrownFiV2PoolState,
		zeroToOne: boolean,
	): number {
		// Get prices with skewness adjustment
		const [price0, price1] = this.getSkewnessPrice(
			pool.price0,
			pool.price1,
			this.parseRawToDefaultDecimals(pool.token0Decimals, pool.reserve0),
			this.parseRawToDefaultDecimals(pool.token1Decimals, pool.reserve1),
			pool.lambda
		);

		if (zeroToOne) {
			return Number(price0) / Number(price1);
		} else {
			return Number(price1) / Number(price0);
		}
	}

	// Helper function to mimic FullMath.mulDiv with bigint
	private mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
		return (a * b) / denominator;
	}

	// Helper function to calculate square root
	private sqrt(value: bigint): bigint {
		if (value === 0n) return 0n;
		let x = value;
		let y = (value + 1n) / 2n;
		while (y < x) {
			x = y;
			y = (value / x + x) / 2n;
		}
		return x;
	}

	// Helper function to convert raw amount to default decimals amount
	private parseRawToDefaultDecimals(tokenDecimals: number, amount: bigint): bigint {
		const tokenDecimalsBig = BigInt(tokenDecimals);
		return tokenDecimalsBig > this.DECIMALS 
			? amount / (10n ** (tokenDecimalsBig - this.DECIMALS))
			: amount * (10n ** (this.DECIMALS - tokenDecimalsBig));
	}

	// Helper function to convert default decimals amount to raw amount
	private parseDefaultDecimalsToRaw(tokenDecimals: number, amount: bigint): bigint {
		const tokenDecimalsBig = BigInt(tokenDecimals);
		return tokenDecimalsBig > this.DECIMALS 
			? amount * (10n ** (tokenDecimalsBig - this.DECIMALS))
			: amount / (10n ** (this.DECIMALS - tokenDecimalsBig));
	}

	// Helper function to get skewness-adjusted prices
	private getSkewnessPrice(
		priceA: bigint,
		priceB: bigint,
		reserveA: bigint,
		reserveB: bigint,
		lambda: bigint
	): [bigint, bigint] {
		if (lambda === 0n) {
			return [priceA, priceB];
		}

		const reserveAPrice = reserveA * priceA;
		const reserveBPrice = reserveB * priceB;

		const reservePriceDiff = reserveAPrice >= reserveBPrice 
			? reserveAPrice - reserveBPrice 
			: reserveBPrice - reserveAPrice;
		const reservePriceSum = reserveAPrice + reserveBPrice;
		const s = this.mulDiv(reservePriceDiff, lambda, reservePriceSum);

		const q64PlusS = this.Q64 + s;
		const q64MinusS = this.Q64 - s;

		if (reserveAPrice >= reserveBPrice) {
			return [
				this.mulDiv(priceA, q64MinusS, this.Q64),
				this.mulDiv(priceB, q64PlusS, this.Q64)
			];
		} else {
			return [
				this.mulDiv(priceA, q64PlusS, this.Q64),
				this.mulDiv(priceB, q64MinusS, this.Q64)
			];
		}
	}

	// Helper function to compute left numerator for complex formula
	private computeLeftNumerator(
		amountIn: bigint,
		priceIn: bigint,
		priceOut: bigint,
		reserveOut: bigint
	): bigint {
		return priceOut * reserveOut + priceIn * amountIn;
	}

	// Helper function to compute left sqrt term for complex formula
	private computeLeftSqrt(
		amountIn: bigint,
		priceIn: bigint,
		priceOut: bigint,
		reserveOut: bigint
	): bigint {
		const temp = this.mulDiv(amountIn, priceIn, this.Q64) > this.mulDiv(reserveOut, priceOut, this.Q64)
			? this.mulDiv(amountIn, priceIn, this.Q64) - this.mulDiv(reserveOut, priceOut, this.Q64)
			: this.mulDiv(reserveOut, priceOut, this.Q64) - this.mulDiv(amountIn, priceIn, this.Q64);
		return temp * temp;
	}

	// Helper function to compute right sqrt term for complex formula
	private computeRightSqrt(
		amountIn: bigint,
		priceIn: bigint,
		priceOut: bigint,
		reserveOut: bigint,
		k: bigint
	): bigint {
		return this.mulDiv(priceIn * priceOut, k, this.Q64 * this.Q64) * 
			   this.mulDiv(reserveOut * amountIn, 2n, this.Q64);
	}
}
