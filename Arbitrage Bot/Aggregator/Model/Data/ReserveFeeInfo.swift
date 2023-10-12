//
//  File.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import Euler

struct ReserveFeeInfo: CustomStringConvertible {
    let exchangeKey: KeyPath<ExchangesList, any Exchange>
    var exchange: any Exchange {
        ExchangesList.shared[keyPath: self.exchangeKey]
    }

    let tokenA: Token
    let tokenB: Token

    let meta: Any

    var spotAB: Double? = nil
    var spotBA: Double? = nil

    func spot(_ tokenA: Token, _ tokenB: Token) -> Double? {
        tokenA < tokenB ? spotAB : spotBA
    }

    let fee: Euler.BigInt

    init(exchangeKey: KeyPath<ExchangesList, any Exchange>, meta: Any, spot: Double, tokenA: Token, tokenB: Token, fee: Euler.BigInt) {
        self.exchangeKey = exchangeKey
        self.meta = meta
        self.spotAB = tokenA < tokenB ? spot : self.spotAB
        self.spotBA = tokenB < tokenA ? spot : self.spotBA
        self.fee = fee
        self.tokenA = tokenA < tokenB ? tokenA : tokenB
        self.tokenB = tokenA < tokenB ? tokenB : tokenA
    }

    func fastQuote(with amount: Euler.BigInt, tokenA: Token, tokenB: Token) throws -> Euler.BigInt {
        let bnQuote = try ReserveFeeInfo.fastQuote(for: self.exchange, with: amount, tokenA: tokenA, tokenB: tokenB, using: meta)
        return bnQuote
    }

    static func fastQuote<T: Exchange>(for exchange: T, with amount: Euler.BigInt, tokenA: Token, tokenB: Token, using meta: Any) throws -> Euler.BigInt {
        guard let meta = meta as? T.Meta else { return .zero }
        return try exchange.getAmountOut(amountIn: amount, tokenA: tokenA, tokenB: tokenB, meta: meta)
    }

    func calculatedQuote(with amount: Euler.BigInt?, aToB: Bool = true) async throws -> Euler.BigInt {
        return try await ReserveFeeInfo.calculatedQuote(for: self.exchange,
                                                        with: amount,
                                                        tokenA: aToB ? tokenA : tokenB,
                                                        tokenB: aToB ? tokenB : tokenA,
                                                        using: self.meta)
    }

    static func calculatedQuote<T: Exchange>(for exchange: T, with amount: Euler.BigInt?, tokenA: Token, tokenB: Token, using meta: Any) async throws -> Euler.BigInt {
        if let amount = amount {
            guard let meta = meta as? T.Meta else { return .zero }
            return try exchange.getAmountOut(amountIn: amount, tokenA: tokenA, tokenB: tokenB, meta: meta)
        }
        return try await exchange.getQuote(maxAvailableAmount: amount,
                                       tokenA: tokenA,
                                       tokenB: tokenB,
                                       maximizeB: true,
                                           meta: meta as? T.Meta).0.amountOut
    }

    public var description: String {
        return "\(ExchangesList.shared[keyPath: exchange.path].name) - \((spotAB ?? 1 / (spotBA ?? 0)))"
    }
}
