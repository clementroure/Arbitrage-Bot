//
//  PriceCalculation.swift
//  Arbitrage-BotTests
//
//  Created by Arthur Guiot on 03/07/2023.
//

#if canImport(SwiftPlot)
import XCTest
@testable import Arbitrage_Bot
import Euler
import SwiftPlot
import AGGRenderer

final class PriceCalculation: XCTestCase {

    override func setUpWithError() throws {
        Environment.shared["JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["WALLET_PRIVATE_KEY"] = "97e74b612c20179a0767b7f6bdfd41f3f14fe9ae84d7a61468b0fae08ee33fe8"
    }

    func testUniswapV2() throws {
        let uniswap = ExchangesList.shared.development.uniswap.exchange as! UniswapV2
        let meta = UniswapV2.RequiredPriceInfo(routerAddress: .zero, factoryAddress: .zero, reserveA: 12345678912345, reserveB: 10000000000)

        self.measure {
            for _ in 0..<1000 {
                let price = try? uniswap.getAmountOut(
                    amountIn: Euler.BigInt(Int.random(in: 12345678...1234123456789)),
                    tokenA: .fake(id: 1),
                    tokenB: .fake(id: 2),
                    meta: meta)
                XCTAssert(price ?? 0 > 0)
            }
        }
    }

    func reserveFee(price: BN, base: Euler.BigInt = 1000.eth.euler, id: Int = 1) -> ReserveFeeInfo {
        let meta = UniswapV2.RequiredPriceInfo(routerAddress: .zero, factoryAddress: .zero, reserveA: base, reserveB: (base * price).rounded())
        return ReserveFeeInfo(exchangeKey: \.development.uniswap.exchange, meta: meta, spot: price.asDouble()!, tokenA: .fake(id: id), tokenB: .fake(id: id + 1), fee: 3)
    }

    func testOptimiser() async throws {
        let step1 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 1800, base: 1.cash),
            reserveFee(price: 1200, base: 100.cash), // Should be chosen, because better reserves
            reserveFee(price: 1100, base: 100.cash)
        ])

        let step2 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 0.55, id: 3),
            reserveFee(price: 0.56, id: 3),
            reserveFee(price: 0.57, id: 3) // Should be chosen
        ])

        let step3 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 23, id: 5),
            reserveFee(price: 25, id: 5),
            reserveFee(price: 24.5, id: 5) // Should be chosen
        ])

        step2.next = step3
        step1.next = step2


        self.measure {
            let price = try! step1.optimalPrice()

            XCTAssertEqual(price.amountIn.description.split(separator: ".").first, 68.cash.description.split(separator: ".").first)
            XCTAssertEqual(price.amountOut.description.split(separator: ".").first, 8941.cash.description.split(separator: ".").first)
        }

//        step1.drawGraph()
    }

    func testTransactionBuilder() async throws {
        let ex1path = \ExchangesList.development.uniswap.exchange
        let ex1 = ExchangesList.shared[keyPath: ex1path] as! UniswapV2
        let (quote1, meta1) = try await ex1.getQuote(maxAvailableAmount: nil,
                                                     tokenA: TokenList[.wethBsctestnet]!,
                                                     tokenB: TokenList[.usdtBsctestnet]!,
                                                     maximizeB: true,
                                                     meta: nil)

        let step1 = BuilderStep(
            tokenA: TokenList[.wethBsctestnet]!,
            tokenB: TokenList[.usdtBsctestnet]!,
            reserveFeeInfos: [
                ReserveFeeInfo(exchangeKey: ex1path,
                               meta: meta1,
                               spot: quote1.transactionPrice.asDouble()!,
                               tokenA: TokenList[.wethBsctestnet]!,
                               tokenB: TokenList[.usdtBsctestnet]!,
                               fee: 3)
            ])

        let ex2path = \ExchangesList.development.pancakeswap.exchange
        let ex2 = ExchangesList.shared[keyPath: ex2path] as! UniswapV2 // Pancakeswap is a fork of Uniswap
        let (quote2, meta2) = try await ex2.getQuote(maxAvailableAmount: nil,
                                                     tokenA: TokenList[.usdtBsctestnet]!,
                                                     tokenB: TokenList[.tkbBsctestnet]!,
                                                     maximizeB: true,
                                                     meta: nil)

        let step2 = BuilderStep(
            tokenA: TokenList[.usdtBsctestnet]!,
            tokenB: TokenList[.tkbBsctestnet]!,
            reserveFeeInfos: [
                ReserveFeeInfo(exchangeKey: ex2path,
                               meta: meta2,
                               spot: quote2.transactionPrice.asDouble()!,
                               tokenA: TokenList[.usdtBsctestnet]!,
                               tokenB: TokenList[.tkbBsctestnet]!,
                               fee: 3)
            ])

        let ex3path = \ExchangesList.development.apeswap.exchange
        let ex3 = ExchangesList.shared[keyPath: ex3path] as! UniswapV2 // Apeswap is a fork of Pancakeswap
        let (quote3, meta3) = try await ex3.getQuote(maxAvailableAmount: nil,
                                                     tokenA: TokenList[.tkbBsctestnet]!,
                                                     tokenB: TokenList[.tkaBsctestnet]!,
                                                     maximizeB: true,
                                                     meta: nil)

        let step3 = BuilderStep(
            tokenA: TokenList[.tkbBsctestnet]!,
            tokenB: TokenList[.tkaBsctestnet]!,
            reserveFeeInfos: [
                ReserveFeeInfo(exchangeKey: ex3path,
                               meta: meta3,
                               spot: quote3.transactionPrice.asDouble()!,
                               tokenA: TokenList[.tkbBsctestnet]!,
                               tokenB: TokenList[.tkaBsctestnet]!,
                               fee: 3)
            ])

        let ex4path = \ExchangesList.development.pancakeswap.exchange
        let ex4 = ExchangesList.shared[keyPath: ex4path] as! UniswapV2 // Pancakeswap is a fork of Uniswap

        let (quote4, meta4) = try await ex4.getQuote(maxAvailableAmount: nil,
                                                     tokenA: TokenList[.tkaBsctestnet]!,
                                                     tokenB: TokenList[.wethBsctestnet]!, // Complete the loop
                                                     maximizeB: true,
                                                     meta: nil)

        let step4 = BuilderStep(
            tokenA: TokenList[.tkaBsctestnet]!,
            tokenB: TokenList[.wethBsctestnet]!,
            reserveFeeInfos: [
                ReserveFeeInfo(exchangeKey: ex4path,
                               meta: meta4,
                               spot: quote4.transactionPrice.asDouble()!,
                               tokenA: TokenList[.tkaBsctestnet]!,
                               tokenB: TokenList[.wethBsctestnet]!,
                               fee: 3)
            ])

        step3.next = step4
        step2.next = step3
        step1.next = step2

//        step1.drawGraph()

        let price = try! step1.optimalPrice()

        let contract = Credentials.shared.web3.eth.Contract(type: SwapRouteCoordinator.self)
        let invocation = contract.startArbitrage(startAmount: price.amountIn.asBigUInt,
                                                 lapExchange: price.path[0].intermediary, // First must be the lap
                                                 steps: price.path)
        let from = Credentials.shared.privateWallet.address
        let gasPrice = try await Credentials.shared.web3.eth.gasPrice()
        let nonce = try await Credentials.shared.web3.eth.getTransactionCount(address: from, block: .latest)
        let tx = invocation.createTransaction(nonce: nonce,
                                              gasPrice: gasPrice,
                                              maxFeePerGas: EthereumQuantity(quantity: 20.gwei),
                                              maxPriorityFeePerGas: nil,
                                              gasLimit: 1000000,
                                              from: from,
                                              value: 0,
                                              accessList: .init(),
                                              transactionType: .legacy)
        guard let signed = try tx?.sign(with: Credentials.shared.privateWallet, chainId: 97) else { return }
        let res = try await Credentials.shared.web3.eth.sendRawTransaction(transaction: signed)

        XCTAssertEqual(res.hex(), "")

        try Credentials.shared.web3.eth
            .subscribeToLogs(addresses: [contract.address!],
                             topics: [
                                contract.events.compactMap { try! EthereumData(ethereumValue: $0.signature.sha3(.keccak256) )}
                             ]) { resp in
                                 XCTAssertNotNil(resp.result)
                             } onEvent: { log in
                                 guard let topicValue = log.result else {
                                     return
                                 }
                                 let amountOut = topicValue.data.ethereumValue().ethereumQuantity?.quantity
                                 print(amountOut)
                             }


        XCTAssertGreaterThan(price.amountOut, price.amountIn)
    }

    func testLogs() async throws {
        let contract = Credentials.shared.web3.eth.Contract(type: SwapRouteCoordinator.self)
        let events = contract.events.compactMap { try! EthereumData(ethereumValue: $0.signature.sha3(.keccak256) )}
        let logs = try await Credentials.shared.web3.eth
            .getTransactionReceipt(transactionHash: .init(ethereumValue: "0x242138414da92a83c5d29a2f65a8c1421262b4af413f616ac70583eafa0dab08"))?
            .logs
            .filter { events.contains($0.topics) } ?? []
        print("Found \(logs.count) logs!")
        for topicValue in logs {
            let amountOut = topicValue.data.ethereumValue().ethereumQuantity?.quantity
            print(amountOut)
        }
    }
}
#endif
