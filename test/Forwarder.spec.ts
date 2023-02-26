import { expect } from "chai";
import { randomBytes } from "ethers/lib/utils";
import { Forwarder, Forwarder__factory } from "../typechain-types";
import { deployer, normalUser, unknownUser } from "./__setup.spec";

let forwarder: Forwarder;

describe("Forwarder", async () => {
    before(async () => {
        const forwarderFactory = await new Forwarder__factory(deployer);
        forwarder = (await forwarderFactory.deploy()) as Forwarder;
        await forwarder.deployed();
    });

    it("User can get nonce", async () => {
        const nonce = await forwarder.getNonce(normalUser.address);
        expect(nonce).to.equal(0);
    });

    it("Forwarder can verify correct signature by EIP-712", async () => {
        const nonce = await forwarder.getNonce(normalUser.address);

        const domainInfo = {
            name: "Forwarder",
            version: "1.0",
            chainId: await normalUser.getChainId(),
            verifyingContract: forwarder.address,
        };

        const types = {
            ForwardRequest: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "nonce", type: "uint256" },
                { name: "data", type: "bytes" },
            ],
        };

        const data = {
            from: normalUser.address,
            to: forwarder.address,
            nonce: nonce,
            data: randomBytes(32),
        };

        const signature = await normalUser._signTypedData(
            domainInfo,
            types,
            data
        );

        expect(await forwarder.verify(data, signature)).to.equal(true);
    });

    it("Forwarder can reject wrong signature by EIP-712", async () => {
        const nonce = await forwarder.getNonce(normalUser.address);

        const domainInfo = {
            name: "Forwarder",
            version: "1.0",
            chainId: await normalUser.getChainId(),
            verifyingContract: forwarder.address,
        };

        const types = {
            ForwardRequest: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "nonce", type: "uint256" },
                { name: "data", type: "bytes" },
            ],
        };

        const data = {
            from: normalUser.address,
            to: forwarder.address,
            nonce: nonce,
            data: randomBytes(32),
        };

        // create a wrong signature
        const wrongSignature = await normalUser._signTypedData(
            domainInfo,
            types,
            { ...data, data: randomBytes(32) }
        );

        expect(await forwarder.verify(data, wrongSignature)).to.equal(false);
    });
});
