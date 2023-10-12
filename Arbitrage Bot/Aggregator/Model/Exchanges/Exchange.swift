//
//  File.swift
//
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Euler
import Foundation

public struct Cost {
    var gas: Euler.BigInt?
    var costInDollars: Double
}

extension EthereumAddress: @unchecked Sendable {}

public struct Receipt {
    var transactionHash: String?
    var amountIn: Euler.BigInt
    var amountOut: Euler.BigInt
    var price: Double
    var exchanges: [String]
    var path: [Token]
}

public enum ExchangeType: String, Codable {
    case dex, cex
}

struct ExchangeAdapter {
    static let uniswap = UniswapV2.self
}

public protocol Exchange: Hashable {

    associatedtype Delegate
    associatedtype Meta

    var path: KeyPath<ExchangesList, ExchangeMetadata>! { get set }
    var type: ExchangeType { get }
    var trigger: PriceDataSubscriptionType { get }
    var fee: Euler.BigInt { get }

    var delegate: Delegate { get }
    var coordinator: EthereumAddress? { get }

    // Info
    var intermediaryStepData: EthereumAddress? { get }

    // Methods

    /// Better than getQuote for fast calculation
    func getAmountOut(amountIn: Euler.BigInt, tokenA: Token, tokenB: Token, meta: Meta) throws -> Euler.BigInt

    /// Returns the best quote for the maximum given amount of tokenA
    func getQuote(maxAvailableAmount: Euler.BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: Meta?) async throws -> (Quote, Meta)

    /// Returns the estimated time to execute a transaction
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int

    /// Returns the estimated cost to execute a transaction in dollars
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost

    /// Buy with fixed input
    /// Buys an exact amount of tokens for another token
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt

    /// Buy with fixed output
    /// Buys an exact amount of tokens for another token
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt

    // Balance methods
    /// Returns the liquidity for the given token
    func balanceFor(token: Token) async throws -> Double

    // Math

    /// Compute the best input for two exchanges
    /// - Parameters:
    ///   - truePriceTokenA: price of token A on next exchange
    ///   - truePriceTokenB: price of token B on next exchange
    ///   - meta: Meta to calculate pice
    /// - Returns: Input
    func computeInputForMaximizingTrade(
        truePriceTokenA: Euler.BigInt,
        truePriceTokenB: Euler.BigInt,
        meta: Meta
    ) -> Euler.BigInt

    func meanPrice(storeId: Int, tokenA: Token, tokenB: Token) async throws -> Quote
}

extension Exchange {
    static func == (lhs: any Exchange, rhs: any Exchange) -> Bool {
        guard lhs.hashValue == rhs.hashValue else { return false }
        return true
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(self.path.hashValue)
    }

    func meanPrice(storeId: Int, tokenA: Token, tokenB: Token) async throws -> Quote {
        let (quote, meta) = try await self.getQuote(maxAvailableAmount: nil, tokenA: tokenA, tokenB: tokenB, maximizeB: true, meta: nil)

        // Store in PriceDataStore
        if let store = priceDataStores[storeId] {
            let key: PartialKeyPath = self.path.appending(path: \.exchange)
            guard let tP = quote.transactionPrice.asDouble() else { throw EvaluationError.ImpossibleOperation }
            var reserveFee = ReserveFeeInfo(exchangeKey: key as! KeyPath<ExchangesList, any Exchange>,
                                            meta: meta,
                                            spot: tP,
                                            tokenA: tokenA,
                                            tokenB: tokenB,
                                            fee: self.fee)
            if tokenA < tokenB {
                reserveFee.spotBA = 1 / tP
            } else {
                reserveFee.spotAB = 1 / tP
            }
            await store.adjacencyList.insert(tokenA: tokenA, tokenB: tokenB, info: reserveFee)
        }

        return quote
    }

}
