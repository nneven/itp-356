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
import {ComeFundMe, ComeFundMeV2} from '../typechain-types'
import {ethers} from 'ethers'
import exp from 'constants'

chai.use(solidity)

describe('ComeFundMe: 6%', () => {
    let s0: SignerWithAddress, s1: SignerWithAddress
    let contract: ComeFundMe

    before(async () => {
        s0 = await signer(0)
        s1 = await signer(1)
    })

    beforeEach(async () => {
        contract = await deployContract<ComeFundMe>('ComeFundMe')
    })

    describe('Unit Tests', () => {
        describe('togglePause', () => {
            it('#1: campaign should not be paused', async () => {
                const isPaused = await contract.paused()
                expect(isPaused).to.be.false
            })

            it('#2: campaign should be paused', async () => {
                await contract.connect(s0).togglePause()
                const isPaused = await contract.paused()
                expect(isPaused).to.be.true
            })
        })

        describe('startCampaign', () => {
            const title = 'Campaign 1'
            const description = 'Campaign description'

            it('#1: startCampaign should emit proper event', async () => {
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                const tx = await contract
                    .connect(s0)
                    .startCampaign(title, description)
                void expect(tx)
                    .to.emit(contract, 'CampaignStarted')
                    .withArgs(campaignId)
            })

            it('#2: startCampaign should work properly', async () => {
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                await successfulTransaction(
                    contract.connect(s0).startCampaign(title, description)
                )
                const campaign = await contract.getCampaign(campaignId)
                expect(campaign.isAlive).to.be.true
                expect(campaign.initiator).to.equal(s0.address)
                expect(campaign.fundsRaised).to.equal(0)
                expect(campaign.title).to.equal(title)
                expect(campaign.description).to.equal(description)
            })
        })

        describe('endCampaign', () => {
            const title = 'Campaign 1'
            const description = 'Campaign description'

            it('#1: endCampaign should emit proper event', async () => {
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                await contract.connect(s0).startCampaign(title, description)
                const tx = await contract.connect(s0).endCampaign(campaignId)
                const campaign = await contract.getCampaign(campaignId)
                void expect(tx)
                    .to.emit(contract, 'CampaignEnded')
                    .withArgs(campaignId, campaign.fundsRaised)
            })

            it('#2: endCampaign should update isAlive properly', async () => {
                const value = ethers.utils.parseEther('1')
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                await contract.connect(s0).startCampaign(title, description)
                let campaign = await contract.getCampaign(campaignId)
                expect(campaign.isAlive).to.be.true
                await contract.connect(s0).endCampaign(campaignId)
                campaign = await contract.getCampaign(campaignId)
                expect(campaign.isAlive).to.be.false
            })
        })

        describe('donateToCampaign', () => {
            let campaignId: string
            beforeEach(async () => {
                const title = 'Campaign 1'
                const description = 'Campaign description'
                campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                await successfulTransaction(
                    contract.connect(s0).startCampaign(title, description)
                )
            })

            it('#1: donateToCampaign should emit proper event', async () => {
                const value = ethers.utils.parseEther('1')
                const tx = await contract
                    .connect(s1)
                    .donateToCampaign(campaignId, {
                        value: value
                    })
                void expect(tx)
                    .to.emit(contract, 'CampaignDonationReceived')
                    .withArgs(campaignId, s1.address, value)
            })

            it('#2: donateToCampaign should work properly', async () => {
                const value = ethers.utils.parseEther('1')
                const tx = await contract
                    .connect(s1)
                    .donateToCampaign(campaignId, {
                        value: value
                    })
                const campaign = await contract.getCampaign(campaignId)
                expect(campaign.fundsRaised).to.equal(value)
            })
        })

        describe('getCampaign', () => {
            it('#1: getCampaign with valid campaign should work properly', async () => {
                const title = 'Campaign 1'
                const description = 'Campaign description'
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                await successfulTransaction(
                    contract.connect(s0).startCampaign(title, description)
                )
                const campaign = await contract.getCampaign(campaignId)
                expect(campaign.isAlive).to.be.true
                expect(campaign.initiator).to.equal(s0.address)
                expect(campaign.fundsRaised).to.equal(0)
                expect(campaign.title).to.equal(title)
                expect(campaign.description).to.equal(description)
            })

            it('#2: getCampaign with invalid campaign should work properly', async () => {
                const title = 'Campaign 1'
                const description = 'Campaign description'
                const campaignId = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                const campaign = await contract.getCampaign(campaignId)
                expect(campaign.isAlive).to.be.false
                expect(campaign.initiator).to.equal(
                    '0x0000000000000000000000000000000000000000'
                )
                expect(campaign.fundsRaised).to.equal(0)
                expect(campaign.title).to.equal('')
                expect(campaign.description).to.equal('')
            })
        })

        describe('getCampaignId', () => {
            it('#1: getCampaignId should work properly', async () => {
                const title = 'Campaign 1'
                const description = 'Campaign description'
                const actualValue = await contract.getCampaignId(
                    s0.address,
                    title,
                    description
                )
                const encoding = ethers.utils.defaultAbiCoder.encode(
                    ['address', 'string', 'string'],
                    [s0.address, title, description]
                )
                const expectedValue = ethers.utils.keccak256(encoding)
                expect(actualValue).to.equal(expectedValue)
            })

            it('#1: getCampaignId should work properly (different values)', async () => {
                const title = 'Campaign 2'
                const description = 'Campaign description 2'
                const actualValue = await contract.getCampaignId(
                    s1.address,
                    title,
                    description
                )
                const encoding = ethers.utils.defaultAbiCoder.encode(
                    ['address', 'string', 'string'],
                    [s1.address, title, description]
                )
                const expectedValue = ethers.utils.keccak256(encoding)
                expect(actualValue).to.equal(expectedValue)
            })
        })
    })

    describe('Functional Tests', () => {
        const title = 'Campaign 1'
        const description = 'Campaign description'
        const value = ethers.utils.parseEther('1')

        it('#1: walk through a fundraising process normally', async () => {
            await successfulTransaction(
                contract.connect(s0).startCampaign(title, description)
            )

            const campaignId = await contract.getCampaignId(
                s0.address,
                title,
                description
            )

            let tx = await contract.connect(s1).donateToCampaign(campaignId, {
                value: value
            })
            void expect(tx)
                .to.emit(contract, 'CampaignDonationReceived')
                .withArgs(campaignId, s1.address, value)

            let campaign = await contract.getCampaign(campaignId)
            expect(campaign.isAlive).to.be.true
            expect(campaign.initiator).to.equal(s0.address)
            expect(campaign.fundsRaised).to.equal(value)
            expect(campaign.title).to.equal(title)
            expect(campaign.description).to.equal(description)

            tx = await contract.connect(s0).endCampaign(campaignId)
            campaign = await contract.getCampaign(campaignId)
            void expect(tx)
                .to.emit(contract, 'CampaignEnded')
                .withArgs(campaignId, campaign.fundsRaised)
        })

        it("#2: perform actions that shouldn't be allowed and check for reverts", async () => {
            await contract.connect(s0).togglePause()
            const isPaused = await contract.paused()
            expect(isPaused).to.be.true
            await expect(contract.connect(s0).startCampaign(title, description))
                .to.be.reverted
            await contract.connect(s0).togglePause()

            const campaignId = await contract.getCampaignId(
                s0.address,
                title,
                description
            )

            await expect(
                contract
                    .connect(s1)
                    .donateToCampaign(campaignId, {value: value})
            ).to.be.reverted

            await successfulTransaction(
                contract.connect(s0).startCampaign(title, description)
            )

            const tx = await contract.connect(s1).donateToCampaign(campaignId, {
                value: value
            })
            void expect(tx)
                .to.emit(contract, 'CampaignDonationReceived')
                .withArgs(campaignId, s1.address, value)

            await expect(contract.connect(s1).endCampaign(campaignId)).to.be
                .reverted

            await contract.connect(s0).endCampaign(campaignId)
            await expect(contract.connect(s0).endCampaign(campaignId)).to.be
                .reverted
        })
    })
})

describe('Extra Credit: 3%', () => {
    let s0: SignerWithAddress, s1: SignerWithAddress
    let contract: ComeFundMeV2

    before(async () => {
        s0 = await signer(0)
        s1 = await signer(1)
    })

    beforeEach(async () => {
        contract = await deployContract<ComeFundMeV2>('ComeFundMeV2')
    })

    describe('Functional Tests', () => {
        const title = 'Campaign 1'
        const description = 'Campaign description'
        const value = ethers.utils.parseEther('1')

        it('#1: walk through a fundraising process normally', async () => {
            await successfulTransaction(
                contract.connect(s0).startCampaign(title, description, '41')
            )

            const campaignId = await contract.getCampaignId(
                s0.address,
                title,
                description
            )

            let tx = await contract.connect(s1).donateToCampaign(campaignId, {
                value: value
            })
            void expect(tx)
                .to.emit(contract, 'CampaignDonationReceived')
                .withArgs(campaignId, s1.address, value)

            let campaign = await contract.getCampaign(campaignId)
            expect(campaign.isAlive).to.be.true
            expect(campaign.initiator).to.equal(s0.address)
            expect(campaign.fundsRaised).to.equal(value)
            expect(campaign.title).to.equal(title)
            expect(campaign.description).to.equal(description)

            tx = await contract.connect(s0).endCampaign(campaignId)
            campaign = await contract.getCampaign(campaignId)
            void expect(tx)
                .to.emit(contract, 'CampaignEnded')
                .withArgs(campaignId, campaign.fundsRaised)
        })

        it("#2: perform actions that shouldn't be allowed and check for reverts", async () => {
            await contract.connect(s0).togglePause()
            const isPaused = await contract.paused()
            expect(isPaused).to.be.true
            await expect(
                contract.connect(s0).startCampaign(title, description, '0')
            ).to.be.reverted
            await contract.connect(s0).togglePause()

            const campaignId = await contract.getCampaignId(
                s0.address,
                title,
                description
            )

            await expect(
                contract
                    .connect(s1)
                    .donateToCampaign(campaignId, {value: value})
            ).to.be.reverted

            await successfulTransaction(
                contract.connect(s0).startCampaign(title, description, '0')
            )

            await expect(
                contract
                    .connect(s1)
                    .donateToCampaign(campaignId, {value: value})
            ).to.be.reverted
            await expect(
                contract.connect(s1).withdrawFromCampaign(campaignId, value)
            ).to.be.reverted

            await expect(contract.connect(s1).endCampaign(campaignId)).to.be
                .reverted

            expect(contract.connect(s0).endCampaign(campaignId)).to.be.ok
        })
    })
})
