//
//  Arbitrage_Bot_DemoTests.swift
//  Arbitrage Bot DemoTests
//
//  Created by Arthur Guiot on 03/07/2023.
//

import XCTest
import Euler
@testable import Arbitrage_Bot
@testable import Arbitrage_Bot_Demo

class Arbitrage_Bot_DemoTests: XCTestCase {
    override func setUpWithError() throws {
        Environment.shared["JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["WALLET_PRIVATE_KEY"] = try EthereumPrivateKey().hex()
        PriceDataStoreWrapper.shared = PriceDataStoreWrapper()
    }

    func testOnTick() async throws {
        let size: Int = 4
        let rates = [1.0, 0.0005563177237620392, .infinity, 2.0,
                     1825.9812561052, 1.0, 446.3807633676, .infinity,
                     .infinity, 0.0025, 1.0, 2.0586373182,
                     0.7440723343, .infinity, 2.3109486084916444, 1.0].reshape(part: size) as! [[Double]]
        
        let tokens = (0..<size).map { Token.fake(id: $0) }
        
        let path = \ExchangesList.development.uniswap.exchange
        let exchange = ExchangesList.shared[keyPath: path] as! UniswapV2
        
        let pass: ((Double, Token, Token) -> ReserveFeeInfo) = { rate, tokenA, tokenB in
            let reserveB = 100.eth.euler * BN(rate)
            let meta = UniswapV2.RequiredPriceInfo(routerAddress: exchange.delegate.address!,
                                                   factoryAddress: exchange.factory,
                                                   reserveA: 100.eth.euler,
                                                   reserveB: reserveB.rounded())
            return ReserveFeeInfo(exchangeKey: path, meta: meta, spot: rate, tokenA: tokenA, tokenB: tokenB, fee: exchange.fee)
        }
        
        for tokenId in 0..<tokens.count {
            let inRates = rates[tokenId][0..<tokenId].enumerated()
                .map { pass($0.element, tokens[tokenId], tokens[$0.offset]) }
            let outRates = rates.map { $0[tokenId] }[0..<tokenId].enumerated()
                .map{ pass($0.element, tokens[$0.offset], tokens[tokenId]) }
            
            for tokenId2 in 0..<inRates.count {
                await PriceDataStoreWrapper.shared?.adjacencyList.insert(tokenA: tokens[tokenId], tokenB: tokens[tokenId2], info: inRates[tokenId2])
                await PriceDataStoreWrapper.shared?.adjacencyList.insert(tokenA: tokens[tokenId2], tokenB: tokens[tokenId], info: outRates[tokenId2])
            }
        }
        
        var ctokens: [CToken] = await (PriceDataStoreWrapper
            .shared?
            .adjacencyList
            .tokens
            .enumerated()
            .map {
                return CToken(index: Int32($0.offset), address: $0.element.address.rawAddress)
            } ?? [])
    
        var flatRates = rates.flatten() as! [Double]
        on_tick(&flatRates, &ctokens, size, 0);
        
        let builder = await PriceDataStoreWrapper.shared?.adjacencyList.builder
        let steps = builder?.steps
    }
}
