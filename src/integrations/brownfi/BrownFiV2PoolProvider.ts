import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import {
	type Address,
	type WatchContractEventOnLogsParameter,
	zeroAddress,
	encodePacked,
} from "viem";
import { BasePoolStateProvider } from "../../base/BasePoolProvider";
import type { BrownFiV2PoolState } from "./BrownFiV2PoolState";
import { FactoryV2Abi } from "./abis/FactoryV2";
import { PairV2Abi } from "./abis/PairV2";
import { PythAbi } from "./abis/Pyth";
import { RouterV2Abi } from "./abis/RouterV2";
import {
	FACTORY_V2_ADDRESS,
	PRICE_FEED_IDS,
	PYTH_ADDRESS,
	ROUTER_V2_ADDRESS,
	WETH,
} from "./constants";

export class BrownFiV2PoolProvider extends BasePoolStateProvider<BrownFiV2PoolState> {
	readonly abi = [...FactoryV2Abi, ...PairV2Abi];
	poolAddresses = new Array<Address>();

	async getAllPools(): Promise<BrownFiV2PoolState[]> {
		// TODO replace by api
		const allPairLength = (await this.client.readContract({
			address: FACTORY_V2_ADDRESS,
			abi: this.abi,
			functionName: "allPairsLength",
			args: [],
		})) as bigint;

		const pairs: BrownFiV2PoolState[] = [];

		for (let i = 0n; i < allPairLength; i += 1n) {
			const poolAddress = (await this.client.readContract({
				address: FACTORY_V2_ADDRESS,
				abi: this.abi,
				functionName: "allPairs",
				args: [i],
			})) as Address;

			const poolState = await this.getPool(poolAddress);
			pairs.push(poolState);

			this.poolAddresses = [...this.poolAddresses, poolAddress];
		}

		// update price update fee metrics each block
		this.client.watchBlockNumber({
			onBlockNumber: (_) => {
				for (const pool of this.poolAddresses) {
					this.updatePoolUpdateFee(pool);
				}
			},
		});

		return pairs;
	}

	async getPool(pool: Address): Promise<BrownFiV2PoolState> {
		const [
			token0,
			token1,
			reserves,
			kappa,
			lambda,
			fee,
			token0Decimals,
			token1Decimals,
		] = await this.client.multicall({
			contracts: [
				{
					address: pool,
					abi: this.abi,
					functionName: "token0",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "token1",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "getReserves",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "k",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "lambda",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "fee",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "token0Decimals",
				},
				{
					address: pool,
					abi: this.abi,
					functionName: "token1Decimals",
				},
			],
		});

		return {
			token0: (token0.result as Address) ?? zeroAddress,
			token1: (token1.result as Address) ?? zeroAddress,
			address: pool,
			reserve0:
				(reserves as { result: bigint[] | undefined }).result?.[0] ?? 0n,
			reserve1:
				(reserves as { result: bigint[] | undefined }).result?.[1] ?? 0n,
			kappa: (kappa.result as bigint) ?? 0n,
			lambda: (lambda.result as bigint) ?? 0n,
			fee: (fee.result as number) ?? 0,
			token0Decimals: (token0Decimals.result as number) ?? 18,
			token1Decimals: (token1Decimals.result as number) ?? 18,
			price0: 0n,
			price1: 0n,
			updateFee: 0n,
			updateFeedData: "0x"
		};
	}

	async swap(
		pool: BrownFiV2PoolState,
		amountIn: bigint,
		zeroToOne: boolean,
	): Promise<void> {
		// check is weth pool
		const isWETH = pool.token0 === WETH || pool.token1 === WETH;

		const swapPath = zeroToOne
			? [pool.token0, pool.token1]
			: [pool.token1, pool.token0];

		const amountOutMin = 0n;
		const to = zeroAddress;

		const latestBlock = await this.client.getBlock();
		const deadline = latestBlock.timestamp + 900n; // 15 minutes from latest block

		await this.client.simulateContract({
			address: ROUTER_V2_ADDRESS,
			abi: RouterV2Abi,
			functionName: isWETH
				? "swapETHForExactTokens"
				: "swapExactTokensForTokens",
			args: isWETH
				? [amountOutMin, swapPath, to, deadline, pool.updateFeedData]
				: [amountIn, amountOutMin, swapPath, to, deadline, pool.updateFeedData],
			value: isWETH ? amountIn : 0n,
		});
	}

	async handleEvent(
		log: WatchContractEventOnLogsParameter<typeof this.abi>[number],
	): Promise<void> {
		if (!log.address) {
			return;
		}

		switch (log.eventName) {
			case "PairCreated": {
				const args = log.args as unknown as {
					token0: Address;
					token1: Address;
					pair: Address;
				};
				const poolState = await this.getPool(args.pair);
				this.pools.set(args.pair, poolState);
				return;
			}
			case "Sync": {
				const args = log.args as {
					reserve0: bigint;
					reserve1: bigint;
				};
				const poolState = this.pools.get(log.address);
				if (!poolState) return;
				poolState.reserve0 = args.reserve0;
				poolState.reserve1 = args.reserve1;
				this.pools.set(log.address, poolState);
				return;
			}
		}
	}

	async updatePoolUpdateFee(poolAddress: Address) {
		const pool = this.pools.get(poolAddress);
		if (!pool) return;

		const priceFeedIds: string[] = [];
		if (PRICE_FEED_IDS[pool.token0]) {
			priceFeedIds.push(PRICE_FEED_IDS[pool.token0] as string);
		}
		if (PRICE_FEED_IDS[pool.token1]) {
			priceFeedIds.push(PRICE_FEED_IDS[pool.token1] as string);
		}

		if (!priceFeedIds.length) return;

		pool.price0 = await this.client.readContract({
			address: FACTORY_V2_ADDRESS,
			abi: this.abi,
			functionName: "priceOf",
			args: [pool.token0, 60n],
		}) as bigint;

		pool.price1 = await this.client.readContract({
			address: FACTORY_V2_ADDRESS,
			abi: this.abi,
			functionName: "priceOf",
			args: [pool.token1, 60n],
		}) as bigint;

		// Create connection to Pyth price service
		const pythConn = new EvmPriceServiceConnection(
			"https://hermes.pyth.network",
		);
		// Get price feed update data
		const priceFeedUpdateData = (await pythConn.getPriceFeedsUpdateData(
			priceFeedIds,
		)) as `0x${string}`[];

		const updateFee = await this.client.readContract({
			address: PYTH_ADDRESS,
			abi: PythAbi,
			functionName: "getUpdateFee",
			args: [priceFeedUpdateData],
		});

		pool.updateFee = updateFee;
		pool.updateFeedData = encodePacked(
			['bytes[]'],
			[priceFeedUpdateData],
		)

		this.pools.set(poolAddress, pool);
	}
}
