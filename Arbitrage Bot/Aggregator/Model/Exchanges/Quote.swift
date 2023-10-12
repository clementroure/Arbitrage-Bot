//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import Euler

public struct Quote: Codable, Sendable {
    var exchangeName: String
    var amount: Euler.BigInt // Amount of tokenA
    var amountOut: Euler.BigInt // Amount of tokenB
    var decimals = 18
    var price: BigDouble // Average price
    var transactionPrice: BigDouble // The price at which we would buy/sell
    var tokenA: Token
    var tokenB: Token
    var ask: Double?
    var bid: Double?
    var ttf: Double?

    enum CodingKeys: String, CodingKey {
        case exchangeName
        case amount
        case amountOut
        case decimals
        case price
        case transactionPrice
        case tokenA
        case tokenB
        case ask
        case bid
        case ttf
    }
    
    public init(exchangeName: String, amount: Euler.BigInt, amountOut: Euler.BigInt, decimals: Int = 18, price: BigDouble, transactionPrice: BigDouble, tokenA: Token, tokenB: Token, ask: Double? = nil, bid: Double? = nil, ttf: Double? = nil) {
        self.exchangeName = exchangeName
        self.amount = amount
        self.amountOut = amountOut
        self.decimals = decimals
        self.price = price
        self.transactionPrice = transactionPrice
        self.tokenA = tokenA
        self.tokenB = tokenB
        self.ask = ask
        self.bid = bid
        self.ttf = ttf
    }
    
    // Custom Codable implementation
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        exchangeName = try container.decode(String.self, forKey: .exchangeName)
        // Custom decoding for BigInt and BigDouble
        let amountString = try container.decode(String.self, forKey: .amount)
        let amountOutString = try container.decode(String.self, forKey: .amountOut)
        let priceString = try container.decode(Double.self, forKey: .price)
        let transactionPriceString = try container.decode(Double.self, forKey: .transactionPrice)
        
        guard let bigUIntAmount = BigInt(amountString),
              let bigUIntAmountOut = BigInt(amountOutString) else {
            throw DecodingError.dataCorrupted(DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Invalid BigUInt or BigDouble value"))
        }
        
        let bigDoublePrice = BigDouble(priceString)
        let bigDoubleTransactionPrice = BigDouble(transactionPriceString)
        
        amount = bigUIntAmount
        amountOut = bigUIntAmountOut
        price = bigDoublePrice
        transactionPrice = bigDoubleTransactionPrice
        
        // Remaining properties
        tokenA = try container.decode(Token.self, forKey: .tokenA)
        tokenB = try container.decode(Token.self, forKey: .tokenB)
        ask = try container.decodeIfPresent(Double.self, forKey: .ask)
        bid = try container.decodeIfPresent(Double.self, forKey: .bid)
        ttf = try container.decodeIfPresent(Double.self, forKey: .ttf)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(exchangeName, forKey: .exchangeName)
        // Custom encoding for BigUInt and BigDouble
        try container.encode(amount.description, forKey: .amount)
        try container.encode(amountOut.description, forKey: .amountOut)
        try container.encode(price.asDouble(), forKey: .price)
        try container.encode(transactionPrice.asDouble(), forKey: .transactionPrice)
        
        // Remaining properties
        try container.encode(tokenA, forKey: .tokenA)
        try container.encode(tokenB, forKey: .tokenB)
        try container.encodeIfPresent(ask, forKey: .ask)
        try container.encodeIfPresent(bid, forKey: .bid)
        try container.encodeIfPresent(ttf, forKey: .ttf)
    }
}
