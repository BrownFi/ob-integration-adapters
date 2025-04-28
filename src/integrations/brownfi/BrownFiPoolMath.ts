import { BasePoolMath } from "../../base/BasePoolMath";
import type { BrownFiBasePoolState } from "./BrownFiBasePoolState";

export class BrownFiPoolMath extends BasePoolMath<BrownFiBasePoolState> {
    private FEE_DENOMINATOR = 10000n;
    // Q128 constant as bigint (2^128)
    private Q128 = 1n << 128n;
    
    override swapExactInput(
        pool: BrownFiBasePoolState,
        zeroToOne: boolean,
        amountIn: bigint,
    ): bigint {
        return amountIn;
    }

	override swapExactOutput(
		pool: BrownFiBasePoolState,
		zeroToOne: boolean,
		amountOut: bigint,
	): bigint {
		// Extract reserves and parameters from pool state
        const [reserveIn, reserveOut] = zeroToOne 
            ? [pool.reserve0, pool.reserve1] 
            : [pool.reserve1, pool.reserve0];
		const oPrice = pool.oraclePrice;
        const kappa = pool.kappa || this.Q128; // Default to Q128 if kappa is not defined

		if (amountOut <= 0n) throw new Error('BrownFiV1Library: INSUFFICIENT_OUTPUT_AMOUNT');
        if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('BrownFiV1Library: INSUFFICIENT_LIQUIDITY');
		
		// Adding fee
        const amountOutWithFee = this.mulDivRoundingUp(
            amountOut,
            this.FEE_DENOMINATOR,
            this.FEE_DENOMINATOR - pool.fee
        );
        
        // Check liquidity constraint: 10 * dx < 9 * x
        if (amountOutWithFee * 10n >= reserveOut * 9n) {
            throw new Error('BrownFiV1Library: INSUFFICIENT_OUTPUT_AMOUNT');
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

	// Helper function to mimic FullMath.mulDivRoundingUp with bigint
    private mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
        const product = a * b;
        let result = product / denominator;
        if (product % denominator > 0n) {
            result = result + 1n;
        }
        return result;
    }

	override spotPriceWithoutFee(
		pool: BrownFiBasePoolState,
		zeroToOne: boolean,
	): number {
		return 1;
	}
}
