// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {YieldSwarmRegistry} from "../src/YieldSwarmRegistry.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {AgentReputation} from "../src/AgentReputation.sol";
import {SmartAccountFactory} from "../src/SmartAccountFactory.sol";
import {SessionKeyModule} from "../src/SessionKeyModule.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address orchestrator = vm.envAddress("ORCHESTRATOR_ADDRESS");

        vm.startBroadcast(deployerKey);

        // 1. Core registry (ERC-721 + ERC-7857 iNFT)
        YieldSwarmRegistry registry = new YieldSwarmRegistry();
        console.log("YieldSwarmRegistry:", address(registry));

        // 2. Strategy approval gate
        StrategyVault vault = new StrategyVault();
        vault.setRegistry(address(registry));
        console.log("StrategyVault:", address(vault));

        // 3. Reputation tracking
        AgentReputation reputation = new AgentReputation();
        reputation.setRegistry(address(registry));
        reputation.setOrchestrator(orchestrator);
        console.log("AgentReputation:", address(reputation));

        // 4. ERC-4337 smart account factory
        SmartAccountFactory factory = new SmartAccountFactory();
        console.log("SmartAccountFactory:", address(factory));

        // 5. Session key module
        SessionKeyModule sessionModule = new SessionKeyModule();
        console.log("SessionKeyModule:", address(sessionModule));

        vm.stopBroadcast();
    }
}
