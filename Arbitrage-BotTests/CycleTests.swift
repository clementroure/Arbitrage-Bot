//
//  Arbitrage_BotTests.swift
//  Arbitrage-BotTests
//
//  Created by Arthur Guiot on 23/06/2023.
//

import XCTest
import Euler

@testable import Arbitrage_Bot
#if canImport(Aggregator)
@testable import Aggregator
#endif

class CycleTests: XCTestCase {
    
    override func setUpWithError() throws {
        Environment.shared["JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["WALLET_PRIVATE_KEY"] = try EthereumPrivateKey().hex()
    }

    func generateExchangeMatrix(size: Int) -> [[Double]] {
        
        var matrix = Array(repeating: Array(repeating: 0.0, count: size), count: size)
        
        for i in 0..<size {
            for j in 0..<size {
                if i == j {
                    // The exchange rate for the same currency is 1
                    matrix[i][j] = 1.0
                } else if i < j {
                    // Generate a random exchange rate between 0.1 and 10
                    let rate = Double.random(in: 0.1...10)
                    matrix[i][j] = rate
                    
                    // Generate a reciprocal rate with ±5% variation
                    let variation = 1.0 + Double.random(in: -0.05...0.05)
                    let reciprocalRate = (1.0 / rate) * variation
                    
                    matrix[j][i] = reciprocalRate
                }
            }
        }
        
        return matrix
    }
    
    func testSnapshot() async throws {
        let rates: [[Double]] = generateExchangeMatrix(size: 200)
        
        let tokens = (0..<rates.count).map { Token(name: "TK\($0 + 1)", address: .init($0 + 1)) }
        
        let list = AdjacencyList()
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
                await list.insert(tokenA: tokens[tokenId], tokenB: tokens[tokenId2], info: inRates[tokenId2])
                await list.insert(tokenA: tokens[tokenId2], tokenB: tokens[tokenId], info: outRates[tokenId2])
            }
        }

        var snapshot = [Double]()
        self.measureAsync {
            snapshot = await list.spotPicture
        }
        
        XCTAssertEqual(snapshot, rates.flatten() as! [Double])
    }
    
    func testBuilder() async throws {
        let rates: [[Double]] = generateExchangeMatrix(size: 200)
        
        let tokens = (0..<rates.count).map { Token(name: "TK\($0 + 1)", address: .init($0 + 1)) }
        
        let list = AdjacencyList()
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
                await list.insert(tokenA: tokens[tokenId], tokenB: tokens[tokenId2], info: inRates[tokenId2])
                await list.insert(tokenA: tokens[tokenId2], tokenB: tokens[tokenId], info: outRates[tokenId2])
            }
        }
        
        let stepPath = [50, 25, 15, 4, 50]
        
        let step = try await list.buildSteps(from: stepPath)
        
        self.measure {
            let optimum = try? step.optimalPrice()
            
//            XCTAssertEqual(optimum?, 116929118010982)
        }


//        XCTAssert(optimum.path.count == 5)
    }
}
