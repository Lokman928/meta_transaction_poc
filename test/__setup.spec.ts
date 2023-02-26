import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/takeSnapshot";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Signer } from "ethers";
import { ethers } from "hardhat";

export let deployer: SignerWithAddress;
export let normalUser: SignerWithAddress;
export let unknownUser: SignerWithAddress;

let snapshot: SnapshotRestorer;

before(async function () {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    normalUser = accounts[1];
    unknownUser = accounts[2];
});

beforeEach(async () => {
    snapshot = await takeSnapshot();
});

afterEach(async () => {
    await snapshot.restore();
});
