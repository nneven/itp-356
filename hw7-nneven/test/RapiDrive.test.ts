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
import {RapiDrive, RPD} from '../typechain-types'
import {ethers} from 'ethers'

chai.use(solidity)

describe('Functional Tests (3%)', () => {
    let s0: SignerWithAddress, s1: SignerWithAddress, s2: SignerWithAddress
    let contract: RapiDrive, token: RPD

    before(async () => {
        s0 = await signer(0)
        s1 = await signer(1)
        s2 = await signer(2)
    })

    beforeEach(async () => {
        token = await deployContract<RPD>('RPD')
        contract = await deployContract<RapiDrive>('RapiDrive', token.address)
    })

    describe('Functional Tests', () => {
        const value = ethers.utils.parseEther('1')

        it('#1: RPD normal function calls', async () => {
            expect(await token.balanceOf(s0.address)).to.be.equal(0)

            await successfulTransaction(
                token.connect(s0).mintRPD({value: value})
            )

            expect(await token.balanceOf(s0.address)).to.be.equal(value)

            await successfulTransaction(
                token.connect(s0).approve(contract.address, value)
            )

            expect(
                await token.allowance(s0.address, contract.address)
            ).to.be.equal(value)
        })

        // eslint-disable-next-line @typescript-eslint/require-await
        it('#2: RPD illegal function calls', async () => {
            void expect(token.connect(s0).decreaseAllowance(s1.address, value))
                .to.be.reverted

            void expect(token.connect(s0).transfer(s0.address, value)).to.be
                .reverted

            void expect(
                token.connect(s0).transferFrom(s0.address, s1.address, value)
            ).to.be.reverted
        })

        it('#3: RapiDrive normal function calls', async () => {
            expect(await token.balanceOf(s0.address)).to.be.equal(0)

            await successfulTransaction(
                token
                    .connect(s0)
                    .mintRPD({value: ethers.utils.parseEther('100')})
            )

            expect(await token.balanceOf(s0.address)).to.be.equal(
                ethers.utils.parseEther('100')
            )

            await successfulTransaction(
                token
                    .connect(s0)
                    .approve(contract.address, ethers.utils.parseEther('100'))
            )

            expect(
                await token.allowance(s0.address, contract.address)
            ).to.be.equal(ethers.utils.parseEther('100'))

            await successfulTransaction(
                contract
                    .connect(s0)
                    .updateRampPair('1', '2', ethers.utils.parseEther('1'))
            )

            await successfulTransaction(
                contract.connect(s0).enterRamp(s0.address, '1')
            )

            await successfulTransaction(
                contract.connect(s0).exitRamp(s0.address, '2')
            )

            expect(await token.balanceOf(s0.address)).to.be.equal(
                ethers.utils.parseEther('99')
            )
        })

        // eslint-disable-next-line @typescript-eslint/require-await
        it('#4: RapiDrive illegal function calls', async () => {
            void expect(contract.connect(s0).enterRamp(s0.address, '1')).to.be
                .reverted

            await successfulTransaction(
                token
                    .connect(s0)
                    .mintRPD({value: ethers.utils.parseEther('100')})
            )

            void expect(contract.connect(s0).enterRamp(s0.address, '1')).to.be
                .reverted

            void expect(contract.connect(s0).exitRamp(s0.address, '1')).to.be
                .reverted
        })
    })
})
