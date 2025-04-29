import { berachainClient } from "../../config";
import { BrownFiPoolProvider } from "./BrownFiPoolProvider";

const stateProvider = new BrownFiPoolProvider(berachainClient);

stateProvider.start();
