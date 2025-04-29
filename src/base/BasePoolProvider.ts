import type {
	Abi,
	Address,
	PublicClient,
	WatchContractEventOnLogsParameter,
} from "viem";
import { AddressMap } from "../helpers/AddressMap";
import type { BasePoolState } from "./BasePoolState";

export abstract class BasePoolStateProvider<TPool extends BasePoolState> {
	pools = new AddressMap<TPool>();
	/**
	 * Make sure to include the abi of all events to be tracked that is necessarily to handle all updates to `BasePoolState`
	 */
	abstract readonly abi: Abi | readonly unknown[];

	constructor(readonly client: PublicClient) {}

	async start() {
		await this.fetchPools();
		this.listenEvents();
	}

	async fetchPools(): Promise<void> {
		const pools = await this.getAllPools();

		for (const pool of pools) {
			this.pools.set(pool.address, pool);
			console.log(`Pool fetched ${pool}`);
		}

		console.log(`Pools fetched ${pools.length}`);
	}

	listenEvents() {
		this.client.watchContractEvent({
			onLogs: (logs) => {
				for (const log of logs) {
					console.log(`Event handled ${log.blockNumber} ${log.logIndex}`);
					this.handleEvent(log);
				}
			},
			abi: this.abi,
		});
	}

	// TO IMPLEMENT

	/**
	 * Handles the logic for getting all the pools that are currently active on a given DEX
	 * should also return the state of the given pools too.
	 * Can do either a query on-chain or an external API
	 */
	abstract getAllPools(): Promise<TPool[]>;

	/**
	 * Must also handled cases where the event is not related to the pool:
	 * - if the event is not related to the integration, it should be ignored.
	 * - if a new pool is found, then add it to this.pools
	 */
	abstract handleEvent(
		log: WatchContractEventOnLogsParameter<typeof this.abi>[number]
	): Promise<void>;

	/**
	 * Given a pool and amountIn, how would a swap be carried out.
	 * It should use the `client` to make a transaction on-chain
	 * This method will be used as a reference. In practise, this will be implemented in the OBRouter
	 */
	abstract swap(
		pool: TPool,
		amountIn: bigint,
		zeroToOne: boolean,
		to?: Address,
		amountOutMin?: bigint,
		deadline?: bigint
	): Promise<void>;
}
