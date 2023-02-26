import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer } from "ethers";
import { randomBytes } from "ethers/lib/utils";
import {
    Forwarder,
    Forwarder__factory,
    Recipient,
    Recipient__factory,
} from "../typechain-types";
import { deployer, normalUser, unknownUser } from "./__setup.spec";

let forwarder: Forwarder;
let recipient: Recipient;
let transactionSigner: SignerWithAddress;

describe("Recipient", async () => {
    before(async () => {
        transactionSigner = normalUser;

        const forwarderFactory = await new Forwarder__factory(deployer);
        forwarder = (await forwarderFactory.deploy()) as Forwarder;
        await forwarder.deployed();

        const recipientFactory = await new Recipient__factory(deployer);
        recipient = (await recipientFactory.deploy(
            forwarder.address
        )) as Recipient;

        await recipient.deployed();
    });

    it("Recipient can get correct message and sender for meta transaction", async () => {
        const nonce = await forwarder.getNonce(transactionSigner.address);

        const domainInfo = {
            name: "Forwarder",
            version: "1.0",
            chainId: await transactionSigner.getChainId(),
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

        const functionData =
            recipient.interface.encodeFunctionData("mockFunction");

        const data = {
            from: transactionSigner.address,
            to: recipient.address,
            nonce: nonce,
            data: functionData,
        };

        const signature = await transactionSigner._signTypedData(
            domainInfo,
            types,
            data
        );

        expect(await forwarder.verify(data, signature)).to.equal(true);

        await expect(await forwarder.execute(data, signature))
            .emit(recipient, "Result")
            .withArgs(await transactionSigner.getAddress(), functionData);
    });

    it("Recipient can get correct message and sender for direct call", async () => {
        const functionData =
            recipient.interface.encodeFunctionData("mockFunction");

        await expect(await recipient.connect(transactionSigner).mockFunction())
            .emit(recipient, "Result")
            .withArgs(transactionSigner.address, functionData);
    });
});
