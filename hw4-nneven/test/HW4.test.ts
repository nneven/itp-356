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
import {HW4} from '../typechain-types'
import {ethers} from 'ethers'

chai.use(solidity)

describe('HW4: 5.5%', () => {
    let contract: HW4
    let s0: SignerWithAddress, s1: SignerWithAddress
    let s0Addr: string, s1Addr: string

    before(async () => {
        s0 = await signer(0)
        s1 = await signer(1)
        s0Addr = s0.address
        s1Addr = s1.address
    })

    beforeEach(async () => {
        contract = await deployContract<HW4>('HW4')
    })

    describe('2) Standalone Function: 1.5%', () => {
        it('1. getMax: 1.5%', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const input = [...Array(10)].map(() =>
                Math.floor(Math.random() * 10000)
            )
            const result = await contract.getMax(input)
            expect(result).equals(Math.max(...input))
        })
    })

    describe('3) Splitter: 4%', () => {
        let recipients: string[]
        const depositAmount = ethers.utils.parseEther(
            `${Math.floor(Math.random() * 10)}`
        )

        before(() => {
            recipients = [s0Addr, s1Addr]
        })

        it('1. Ownable: 0.5%', async () => {
            expect(await contract.owner()).equals(s0Addr)
            const tx = await contract.connect(s0).transferOwnership(s1Addr)
            void expect(tx)
                .to.emit(contract, 'OwnershipTransferred')
                .withArgs(s1Addr)
            expect(await contract.owner()).equals(s1Addr)
            await expect(contract.connect(s0).transferOwnership(s0Addr)).to.be
                .reverted
        })
        it('2. Pausable: 0.5%', async () => {
            expect(await contract.paused()).equals(false)
            await contract.connect(s0).togglePause()
            expect(await contract.paused()).equals(true)
        })
        describe('3. Deposit: 1.5%', () => {
            it('A. deposit() + balanceOf(): 1.2%', async () => {
                const tx = await contract.connect(s0).deposit(recipients, {
                    value: depositAmount
                })
                void expect(tx)
                    .to.emit(contract, 'DidDepositFunds')
                    .withArgs(depositAmount, recipients)
                const balanceS0 = await contract.balanceOf(s0Addr)
                expect(balanceS0).equals(depositAmount.div(recipients.length))
            })
            it('B. deposit() cannot run while paused: 0.3%', async () => {
                await contract.connect(s0).togglePause()
                await expect(
                    contract.connect(s0).deposit(recipients, {
                        value: depositAmount
                    })
                ).to.be.reverted
            })
        })
        describe('4. Withdraw: 1.5%', () => {
            it('A. Normal withdraw(): 0.9%', async () => {
                const startingBalanceS0 = await s0.getBalance()
                const startingBalanceS1 = await s1.getBalance()
                const receiptS0Deposit = await successfulTransaction(
                    contract.connect(s0).deposit(recipients, {
                        value: depositAmount
                    })
                )
                const withdrawAmount = await contract.balanceOf(s0Addr)
                const txS0 = await contract.connect(s0).withdraw(withdrawAmount)
                const receiptS0 = await txS0.wait()
                const receiptS1 = await successfulTransaction(
                    contract.connect(s1).withdraw(withdrawAmount)
                )
                void expect(txS0)
                    .to.emit(contract, 'DidWithdrawFunds')
                    .withArgs(withdrawAmount, s0.address)
                expect(await s0.getBalance()).equals(
                    startingBalanceS0
                        .sub(depositAmount)
                        .sub(
                            receiptS0Deposit.gasUsed.mul(
                                receiptS0Deposit.effectiveGasPrice
                            )
                        )
                        .sub(receiptS0.gasUsed.mul(receiptS0.effectiveGasPrice))
                        .add(withdrawAmount)
                )
                expect(await s1.getBalance()).equals(
                    startingBalanceS1
                        .sub(receiptS1.gasUsed.mul(receiptS1.effectiveGasPrice))
                        .add(withdrawAmount)
                )
            })
            it('B. withdraw() overdraft should fail: 0.3%', async () => {
                await contract.connect(s0).deposit(recipients, {
                    value: depositAmount
                })
                const withdrawAmount = await contract.balanceOf(s0Addr)
                await expect(
                    contract.connect(s1).withdraw(withdrawAmount.mul(2))
                ).to.be.reverted
            })
            it('C. withdraw() cannot run while paused: 0.3%', async () => {
                await contract.connect(s0).togglePause()
                await expect(contract.connect(s0).withdraw(0)).to.be.reverted
            })
        })
    })
})
