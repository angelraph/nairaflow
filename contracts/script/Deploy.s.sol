// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StablecoinRegistry} from "../src/StablecoinRegistry.sol";
import {PolicyManager} from "../src/PolicyManager.sol";
import {AgentExecutor} from "../src/AgentExecutor.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";
import {SavingsCircleFactory} from "../src/SavingsCircleFactory.sol";
import {GoalVault} from "../src/GoalVault.sol";
import {GoalVaultFactory} from "../src/GoalVaultFactory.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockUSDG} from "../src/mocks/MockUSDG.sol";

/// @notice One parameterized script, run against both chains with `--rpc-url`. Deploys the
/// full NairaFlow stack and wires the pieces together in the order their constructors/setters
/// require. Set DEPLOY_MOCKS=true to also deploy and register MockUSDC/MockUSDG (used on
/// chains with no confirmed canonical stablecoin — see docs/ARCHITECTURE.md) and
/// REAL_USDC_ADDRESS to register a real, already-deployed USDC instead.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address agentAddress = vm.envOr("AGENT_ADDRESS", deployer);
        bool deployMocks = vm.envOr("DEPLOY_MOCKS", true);
        address realUsdc = vm.envOr("REAL_USDC_ADDRESS", address(0));

        vm.startBroadcast(deployerKey);

        StablecoinRegistry registry = new StablecoinRegistry(deployer);
        console.log("StablecoinRegistry:", address(registry));

        if (realUsdc != address(0)) {
            registry.registerToken(realUsdc);
            console.log("Registered real USDC:", realUsdc);
        }

        if (deployMocks) {
            MockUSDC mockUsdc = new MockUSDC();
            MockUSDG mockUsdg = new MockUSDG();
            registry.registerToken(address(mockUsdc));
            registry.registerToken(address(mockUsdg));
            console.log("MockUSDC:", address(mockUsdc));
            console.log("MockUSDG:", address(mockUsdg));
        }

        PolicyManager policyManager = new PolicyManager(deployer);
        console.log("PolicyManager:", address(policyManager));

        AgentExecutor agentExecutor = new AgentExecutor(address(policyManager), deployer, agentAddress);
        console.log("AgentExecutor:", address(agentExecutor));

        policyManager.setExecutor(address(agentExecutor));

        SavingsCircle circleImplementation = new SavingsCircle();
        SavingsCircleFactory circleFactory =
            new SavingsCircleFactory(address(circleImplementation), address(registry), deployer, deployer);
        console.log("SavingsCircle implementation:", address(circleImplementation));
        console.log("SavingsCircleFactory:", address(circleFactory));

        GoalVault vaultImplementation = new GoalVault();
        GoalVaultFactory vaultFactory = new GoalVaultFactory(address(vaultImplementation), address(registry), deployer, deployer);
        vaultFactory.setAgentExecutor(address(agentExecutor));
        console.log("GoalVault implementation:", address(vaultImplementation));
        console.log("GoalVaultFactory:", address(vaultFactory));

        vm.stopBroadcast();
    }
}
