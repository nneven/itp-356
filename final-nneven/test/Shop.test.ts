// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before, describe} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {Shop} from '../typechain-types'
import {ethers, Transaction} from 'ethers'

chai.use(solidity)

describe('Shop: 30%', () => {
    let contract: Shop
    let owner: SignerWithAddress, customer: SignerWithAddress
    const name = 'Name',
        imageUrl =
            'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a',
        description = 'Description',
        amount = 100,
        price = 1,
        points = 20,
        newImageUrl = '1',
        newDescription = '2',
        newAmount = 200,
        newPrice = 2,
        newPoints = 40,
        customerPurchaseAmount = 10
    let sku: string

    before(async () => {
        owner = await signer(0)
        customer = await signer(1)
    })

    beforeEach(async () => {
        contract = await deployContract<Shop>('Shop')
        sku = await contract.generateSku(name)
    })

    describe('addItem + getItem: 5%', () => {
        let tx: Transaction
        beforeEach(async () => {
            tx = await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
        })

        it('Should emit proper events: 1%', () => {
            void expect(tx).to.emit(contract, 'ItemAdded').withArgs(sku)
        })

        it('Should read the values properly: 2%', async () => {
            const item = await contract.getItem(sku)
            expect(item.name).equals(name)
            expect(item.imageUrl).equals(imageUrl)
            expect(item.description).equals(description)
            expect(item.amount).equals(amount)
            expect(item.price).equals(price)
            expect(item.points).equals(points)
            expect(item.disabled).equals(false)
        })

        it('Should disallow creating item with same name: 2%', async () => {
            await expect(
                contract
                    .connect(owner)
                    .addItem(name, imageUrl, description, amount, price, points)
            ).to.be.revertedWith('Item exists')
        })
    })

    describe('editItem: 3%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            tx = await contract
                .connect(owner)
                .editItem(sku, newImageUrl, newDescription, newPrice, newPoints)
        })
        it('Should emit proper events: 1%', () => {
            void expect(tx).to.emit(contract, 'ItemEdited').withArgs(sku)
        })
        it('Should actually modify SKU: 1%', async () => {
            const item = await contract.getItem(sku)
            expect(item.imageUrl).equals(newImageUrl)
            expect(item.description).equals(newDescription)
            expect(item.price).equals(newPrice)
            expect(item.points).equals(newPoints)
        })
        it('Should disallow editing non-existant SKU: 1%', async () => {
            await expect(
                contract
                    .connect(owner)
                    .editItem(
                        ethers.utils.formatBytes32String(''),
                        newImageUrl,
                        newDescription,
                        newPrice,
                        newPoints
                    )
            ).to.be.revertedWith("Item doesn't exist")
        })
    })

    describe('disableItem: 2%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            tx = await contract.connect(owner).disableItem(sku)
        })
        it('Should emit the proper event: 1%', () => {
            void expect(tx).to.emit(contract, 'ItemDisabled').withArgs(sku)
        })
        it('Should reflect disable when getting: 1%', async () => {
            const item = await contract.getItem(sku)
            expect(item.disabled).equals(true)
        })
    })

    describe('enableItem: 2%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            await contract.connect(owner).disableItem(sku)
            tx = await contract.connect(owner).enableItem(sku)
        })
        it('Should emit the proper event: 1%', () => {
            void expect(tx).to.emit(contract, 'ItemEnabled').withArgs(sku)
        })
        it('Should reflect disable when getting: 1%', async () => {
            const item = await contract.getItem(sku)
            expect(item.disabled).equals(false)
        })
    })

    describe('restockItem: 2%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            tx = await contract
                .connect(owner)
                .restockItem(sku, newAmount - amount)
        })
        it('Should emit the proper event: 1%', () => {
            void expect(tx)
                .to.emit(contract, 'ItemRestocked')
                .withArgs(sku, newAmount - amount)
        })
        it('Should reflect restocked amount when getting: 1%', async () => {
            const item = await contract.getItem(sku)
            expect(item.amount).equals(newAmount)
        })
    })

    describe('buy + getPoints: 14%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            tx = await contract
                .connect(customer)
                .buy(sku, customerPurchaseAmount, false, {
                    value: customerPurchaseAmount * price
                })
        })
        it('Should emit the proper events: 1%', () => {
            void expect(tx)
                .to.emit(contract, 'ItemBought')
                .withArgs(sku, customerPurchaseAmount, customer.address)
        })
        it('Should disallow buying a non-existant item: 1%', async () => {
            await expect(
                contract
                    .connect(customer)
                    .buy(
                        ethers.utils.formatBytes32String(''),
                        customerPurchaseAmount,
                        false,
                        {
                            value: customerPurchaseAmount * price
                        }
                    )
            ).to.be.revertedWith("Item doesn't exist")
        })
        it('Should disallow buying a disabled item: 1%', async () => {
            await contract.connect(owner).disableItem(sku)
            await expect(
                contract
                    .connect(customer)
                    .buy(sku, customerPurchaseAmount, false, {
                        value: customerPurchaseAmount * price
                    })
            ).to.be.revertedWith('Item disabled')
        })
        it('Should disallow buying with wrong value sent: 2%', async () => {
            await expect(
                contract
                    .connect(customer)
                    .buy(sku, customerPurchaseAmount, false, {
                        value: customerPurchaseAmount * price * 2
                    })
            ).to.be.revertedWith('Bad Ether value')
        })
        it("Should disallow buying more than what's available: 2%", async () => {
            await expect(
                contract.connect(customer).buy(sku, amount + 1, false, {
                    value: (amount + 1) * price
                })
            ).to.be.reverted
        })
        it('Should count user points properly: 1%', async () => {
            const userPoints = await contract.getPoints(customer.address)
            expect(userPoints).equals(points * customerPurchaseAmount)
        })
        it('Should let user redeem using points: 3%', async () => {
            tx = await contract
                .connect(customer)
                .buy(sku, customerPurchaseAmount, true)
            void expect(tx)
                .to.emit(contract, 'ItemBought')
                .withArgs(sku, customerPurchaseAmount, customer.address)
        })
        it('Should not accept Ether when redeeming with points: 3%', async () => {
            await expect(
                contract
                    .connect(customer)
                    .buy(sku, customerPurchaseAmount, true, {
                        value: customerPurchaseAmount * price
                    })
            ).to.be.revertedWith("Don't send Ether")
        })
    })

    describe('withdraw: 2%', () => {
        let tx: Transaction
        beforeEach(async () => {
            await contract
                .connect(owner)
                .addItem(name, imageUrl, description, amount, price, points)
            await contract
                .connect(customer)
                .buy(sku, customerPurchaseAmount, false, {
                    value: customerPurchaseAmount * price
                })
            tx = await contract.connect(owner).withdraw()
        })
        it('Should withdraw the proper amount of Ether: 2%', () => {
            void expect(tx).changeEtherBalance(
                owner,
                customerPurchaseAmount * price
            )
        })
    })
})
