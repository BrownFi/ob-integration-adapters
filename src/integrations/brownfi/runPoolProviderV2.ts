import { berachainClient } from "../../config";
import { BrownFiV2PoolProvider } from "./BrownFiV2PoolProvider";

// const stateProvider = new BrownFiPoolProvider(berachainClient);
const stateProvider = new BrownFiV2PoolProvider(berachainClient);

stateProvider.start();
