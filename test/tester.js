const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { impersonateFundErc20 } = require("../contracts/utils/utilities");
const { abi } = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");
const provider = waffle.provider; // mainnet fork

describe("FlashSwap Contract", () => {
    let FLASHSWAP, BORROW_AMOUNT, FUND_AMOUNT, initialFundingHuman, txArbitrage, gasUsedUSD;

    const DECIMALS = 18;

    const BUSD_WHALE = "0xf977814e90da44bfa03b6295a0616a897441acec";
    const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
    const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
    const CROX = "0x2c094F5A7D1146BB93850f629501eB749f6Ed491";

    const BASE_TOKEN_ADDRESS = BUSD; // What our starting TOKEN gonna be
    const tokenBase = new ethers.Contract(BASE_TOKEN_ADDRESS, abi, provider);

    beforeEach(async () => {
        // Get the Owner as a Signer
        [owner] = await ethers.getSigners();
        // Ensure the Whale has a balance
        const whale_balance = await provider.getBalance(BUSD_WHALE);
        expect(whale_balance).not.eq("0");
        // Deploy our Smart Contract
        const FlashSwap = await ethers.getContractFactory("PancakeFlashSwap");
        FLASHSWAP = await FlashSwap.deploy();
        await FLASHSWAP.deployed();
        // Configure our Borrowing
        const borrowAmountHuman = "1"; // Im borrowing 1 BUSD
        BORROW_AMOUNT = ethers.utils.parseUnits(borrowAmountHuman, DECIMALS);
        // Configure Funding
        initialFundingHuman = "1";
        FUND_AMOUNT = ethers.utils.parseUnits(initialFundingHuman, DECIMALS);
        // Fund our Contract for testing ONLY
        await impersonateFundErc20(tokenBase, BUSD_WHALE, FLASHSWAP.address, initialFundingHuman);
    });    

    describe("Arbitrage Execution", () => {
        it("Ensures the contract is funded", async () => {
            const flashSwapBalance = await FLASHSWAP.getBalanceOfToken(BASE_TOKEN_ADDRESS);
            const flashSwapBalanceHuman = ethers.utils.formatUnits(flashSwapBalance, DECIMALS);
            expect(Number(flashSwapBalanceHuman)).eq(Number(initialFundingHuman));
        });

        it("Execute the arbitrage", async () => {
            txArbitrage = await FLASHSWAP.startArbitrage(BASE_TOKEN_ADDRESS, BORROW_AMOUNT);
            assert(txArbitrage);
            // Print the Balances
            const contractBalanceBUSD = await FLASHSWAP.getBalanceOfToken(BUSD);
            const formatedBalBUSD = Number(ethers.utils.formatUnits(contractBalanceBUSD, DECIMALS));
            console.log("Balance of BUSD: " + formatedBalBUSD);
            const contractBalanceCROX = await FLASHSWAP.getBalanceOfToken(CROX);
            const formatedBalCROX = Number(ethers.utils.formatUnits(contractBalanceCROX, DECIMALS));
            console.log("Balance of CROX: " + formatedBalCROX);
            const contractBalanceCAKE = await FLASHSWAP.getBalanceOfToken(CAKE);
            const formatedBalCAKE = Number(ethers.utils.formatUnits(contractBalanceCAKE, DECIMALS));
            console.log("Balance of CAKE: " + formatedBalCAKE);
        });
    });
});


