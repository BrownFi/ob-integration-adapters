import { BasePoolMath } from "../../base/BasePoolMath";
import type { BrownFiPoolState } from "./BrownFiPoolState";

export class BrownFiPoolMath extends BasePoolMath<BrownFiPoolState> {
	private FEE_DENOMINATOR = 10000n;
	// Q128 constant as bigint (2^128)
	private Q128 = 1n << 128n;

	/**
	 * @dev The function is expected to fetch the latest pool state on each call.
	 */
	override swapExactInput(
		pool: BrownFiPoolState,
		zeroToOne: boolean,
		amountIn: bigint
	): bigint {
		// Extract reserves and parameters from pool state
		const [reserveIn, reserveOut] = zeroToOne
			? [pool.reserve0, pool.reserve1]
			: [pool.reserve1, pool.reserve0];

		// get oracle price
		const oPrice = pool.oraclePrice;

		const kappa = pool.kappa || this.Q128; // Default to Q128 if kappa is not defined
		if (amountIn <= 0n)
			throw new Error("BrownFiV1Library: INSUFFICIENT_INPUT_AMOUNT");
		if (reserveIn <= 0n || reserveOut <= 0n)
			throw new Error("BrownFiV1Library: INSUFFICIENT_LIQUIDITY");

		let amountOut: bigint;

		if (kappa == this.Q128 * 2n) {
			if (zeroToOne) {
				// dy = P * y * dx / (P * dx + y)
				amountOut =
					(this.mulDivRoundingUp(oPrice, reserveOut, this.Q128) * amountIn) /
					(this.mulDivRoundingUp(oPrice, amountIn, this.Q128) + reserveOut);
			} else {
				// dx = (x * dy) / (P * x + dy)
				amountOut =
					(amountIn * reserveOut) /
					(this.mulDivRoundingUp(oPrice, reserveOut, this.Q128) + amountIn);
			}
		} else {
			const sqrtDelta = BigInt(
				Math.round(
					Math.sqrt(
						Number(this.delta(amountIn, reserveOut, kappa, oPrice, zeroToOne))
					)
				)
			);
			if (zeroToOne) {
				// P * dx + y - sqrt(delta)
				const numerator =
					this.mulDivRoundingUp(oPrice, amountIn, this.Q128) +
					reserveOut -
					sqrtDelta;
				// (2 - K)
				const denominator = this.Q128 * 2n - kappa;
				amountOut = this.mulDivRoundingUp(numerator, this.Q128, denominator);
			} else {
				// P * x + dy - sqrt(delta)
				const numerator =
					this.mulDivRoundingUp(oPrice, reserveOut, this.Q128) +
					amountIn -
					sqrtDelta;
				// P * (2 - K)
				const denominator = this.mulDivRoundingUp(
					oPrice,
					this.Q128 * 2n - kappa,
					this.Q128
				);
				amountOut = this.mulDivRoundingUp(numerator, this.Q128, denominator);
			}
		}

		// Exclude fee from amount out
		return this.mulDivRoundingUp(
			amountOut,
			this.FEE_DENOMINATOR - pool.fee,
			this.FEE_DENOMINATOR
		);
	}

	/**
	 * @dev The function is expected to fetch the latest pool state on each call.
	 */
	override swapExactOutput(
		pool: BrownFiPoolState,
		zeroToOne: boolean,
		amountOut: bigint
	): bigint {
		// Extract reserves and parameters from pool state
		const [reserveIn, reserveOut] = zeroToOne
			? [pool.reserve0, pool.reserve1]
			: [pool.reserve1, pool.reserve0];

		// get oracle price
		const oPrice = pool.oraclePrice;

		const kappa = pool.kappa || this.Q128; // Default to Q128 if kappa is not defined

		if (amountOut <= 0n)
			throw new Error("BrownFiV1Library: INSUFFICIENT_OUTPUT_AMOUNT");
		if (reserveIn <= 0n || reserveOut <= 0n)
			throw new Error("BrownFiV1Library: INSUFFICIENT_LIQUIDITY");

		// Adding fee
		const amountOutWithFee = this.mulDivRoundingUp(
			amountOut,
			this.FEE_DENOMINATOR,
			this.FEE_DENOMINATOR - pool.fee
		);

		// Check liquidity constraint: 10 * dx < 9 * x
		if (amountOutWithFee * 10n >= reserveOut * 9n) {
			throw new Error("BrownFiV1Library: INSUFFICIENT_OUTPUT_AMOUNT");
		}

		// Compute price impact: R = (K * dx) / (x - dx)
		const r = this.mulDivRoundingUp(
			kappa,
			amountOutWithFee,
			reserveOut - amountOutWithFee
		);

		let avgPrice: bigint;
		let amountIn: bigint;

		// Compute average trading price based on swap direction
		if (zeroToOne) {
			// (2 + R) / (2 * P)
			avgPrice = this.mulDivRoundingUp(
				this.Q128 * 2n + r,
				this.Q128,
				oPrice * 2n
			);
			amountIn = this.mulDivRoundingUp(amountOutWithFee, avgPrice, this.Q128);
		} else {
			// P * (2 + R) / 2
			avgPrice = this.mulDivRoundingUp(
				oPrice,
				this.Q128 * 2n + r,
				this.Q128 * 2n
			);
			amountIn = this.mulDivRoundingUp(amountOutWithFee, avgPrice, this.Q128);
		}

		return amountIn;
	}

	override spotPriceWithoutFee(
		pool: BrownFiPoolState,
		zeroToOne: boolean
	): number {
		let price;
		if (pool.qti == 0n) {
			if (pool.decimalShift > 0n) {
				price =
					Number(10n ** pool.decimalShift * this.Q128) /
					Number(pool.oraclePrice);
			} else if (pool.decimalShift < 0n) {
				price =
					Number(this.Q128) /
					Number(pool.oraclePrice * 10n ** -pool.decimalShift);
			} else {
				price = Number(this.Q128) / Number(pool.oraclePrice);
			}
		} else {
			if (pool.decimalShift > 0n) {
				price =
					Number(pool.oraclePrice * 10n ** pool.decimalShift) /
					Number(this.Q128);
			} else if (pool.decimalShift < 0n) {
				price =
					Number(pool.oraclePrice) /
					Number(10n ** -pool.decimalShift * this.Q128);
			} else {
				price = Number(pool.oraclePrice) / Number(this.Q128);
			}
		}

		if (zeroToOne) return pool.qti == 0n ? 1 / price : price;
		else return pool.qti == 0n ? price : 1 / price;
	}

	// Helper function to mimic FullMath.mulDivRoundingUp with bigint
	private mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
		const product = a * b;
		let result = product / denominator;
		if (product % denominator > 0n) {
			result = result + 1n;
		}
		return result;
	}

	// Helper function to calculate delta
	private delta(
		amountIn: bigint,
		reserveOut: bigint,
		kappa: bigint,
		oPrice: bigint,
		isSell: boolean
	): bigint {
		let temp1: bigint;
		let temp2: bigint;
		if (isSell) {
			// temp1 = (P * dx - y)^2
			if (this.mulDivRoundingUp(oPrice, amountIn, this.Q128) < reserveOut) {
				temp1 = reserveOut - this.mulDivRoundingUp(oPrice, amountIn, this.Q128);
				temp1 = temp1 * temp1;
			} else {
				temp1 = this.mulDivRoundingUp(oPrice, amountIn, this.Q128) - reserveOut;
				temp1 = temp1 * temp1;
			}
		} else {
			// temp1 = (P * x - dy)^2
			if (this.mulDivRoundingUp(oPrice, reserveOut, this.Q128) < amountIn) {
				temp1 = amountIn - this.mulDivRoundingUp(oPrice, reserveOut, this.Q128);
				temp1 = temp1 * temp1;
			} else {
				temp1 = this.mulDivRoundingUp(oPrice, reserveOut, this.Q128) - amountIn;
				temp1 = temp1 * temp1;
			}
		}
		// temp2 = 2 * P * K * y * dx
		temp2 =
			this.mulDivRoundingUp(oPrice, amountIn, this.Q128) *
			this.mulDivRoundingUp(kappa, reserveOut, this.Q128) *
			2n;
		return temp1 + temp2;
	}
}
