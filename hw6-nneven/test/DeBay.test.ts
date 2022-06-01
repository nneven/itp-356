// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {DeBay} from '../typechain-types'
import {ethers} from 'ethers'
// eslint-disable-next-line no-duplicate-imports
import {ethers as ethersHH} from 'hardhat'
import exp from 'constants'

chai.use(solidity)

describe('DeBay Functional Tests: 3%', () => {
    let s0: SignerWithAddress, s1: SignerWithAddress, s2: SignerWithAddress
    let contract: DeBay

    before(async () => {
        s0 = await signer(0)
        s1 = await signer(1)
        s2 = await signer(2)
    })

    beforeEach(async () => {
        contract = await deployContract<DeBay>('DeBay')
    })

    describe('Functional Tests', () => {
        const name = 'Auction 1'
        const imgUrl = 'URL'
        const description = 'Auction description'
        const floor = ethers.utils.parseEther('0.1')
        const deadline = 10000000000
        const value = ethers.utils.parseEther('1')

        it('#1: walk through a auction process normally', async () => {
            await successfulTransaction(
                contract
                    .connect(s0)
                    .startAuction(name, imgUrl, description, floor, deadline)
            )

            const auctionId = await contract.getAuctionId(
                s0.address,
                deadline,
                name,
                imgUrl,
                description
            )

            let tx = await contract.connect(s1).deposit({
                value: value
            })

            tx = await contract
                .connect(s1)
                ['bid(bytes32,uint256)'](
                    auctionId,
                    ethers.utils.parseEther('0.5')
                )

            void expect(tx)
                .to.emit(contract, 'Bid')
                .withArgs(auctionId, s1.address, ethers.utils.parseEther('0.5'))

            tx = await contract.connect(s2)['bid(bytes32)'](auctionId, {
                value: value
            })

            void expect(tx)
                .to.emit(contract, 'Bid')
                .withArgs(auctionId, s2.address, value)

            const time = Math.round(Date.now() / 1000) + 1000000000000000
            await ethersHH.provider.send('evm_setNextBlockTimestamp', [time])
            await ethersHH.provider.send('evm_mine', [])

            tx = await contract.connect(s0).settle(auctionId)
            void expect(tx)
                .to.emit(contract, 'AuctionEnded')
                .withArgs(auctionId, s2.address, value)

            await successfulTransaction(contract.connect(s1).withdraw())
        })

        it("#2: perform actions that shouldn't be allowed and check for reverts", async () => {
            await successfulTransaction(
                contract
                    .connect(s0)
                    .startAuction(name, imgUrl, description, floor, deadline)
            )

            await expect(
                contract
                    .connect(s0)
                    .startAuction(name, imgUrl, description, floor, deadline)
            ).to.be.reverted

            const auctionId = await contract.getAuctionId(
                s0.address,
                deadline,
                name,
                imgUrl,
                description
            )

            await expect(
                contract.connect(s0)['bid(bytes32)'](auctionId, {value: value})
            ).to.be.reverted

            await expect(
                contract.connect(s1)['bid(bytes32)'](auctionId, {value: '0'})
            ).to.be.reverted

            await expect(
                contract.connect(s1)['bid(bytes32,uint256)'](auctionId, value)
            ).to.be.reverted

            await expect(contract.connect(s1).withdraw()).to.be.reverted

            await expect(contract.connect(s0).settle(auctionId)).to.be.reverted
        })
    })
})
