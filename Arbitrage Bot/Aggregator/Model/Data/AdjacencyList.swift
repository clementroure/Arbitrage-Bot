//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

actor AdjacencyList {
    struct Pair: Hashable {
        let tokenA: Token
        let tokenB: Token
        
        init(_ tokenA: Token, _ tokenB: Token) {
            let (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA)
            
            self.tokenA = token0
            self.tokenB = token1
        }
    }
    internal var prices: [Pair: [Int: ReserveFeeInfo]]
    internal var tokens: [Token]
    
    let builder = Builder()
    
    init() {
        prices = [:]
        tokens = []
    }
    
    func remove(pair: Pair) {
        self.prices.removeValue(forKey: pair)
    }
    
    func insert(tokenA: Token, tokenB: Token, info: ReserveFeeInfo) {
        let (token0, token1) = (info.tokenA, info.tokenB)
        var queue = [token0, token1].filter { !self.tokens.contains($0) }
        var i = 0
        while !queue.isEmpty {
            if i >= self.tokens.count || queue[0] < self.tokens[i] {
                self.tokens.insert(queue[0], at: i)
                queue.removeFirst()
            }
            i += 1
        }
        
        let index = Pair(token0, token1)
        
        if prices[index] == nil {
            prices[index] = [:]
        }
        
        var oldInfo = prices[index]?[info.exchangeKey.hashValue] ?? info
        
        if tokenA < tokenB {
            oldInfo.spotAB = info.spotAB ?? oldInfo.spotAB
        } else {
            oldInfo.spotBA = info.spotBA ?? oldInfo.spotBA
        }
        
        prices[index]?[info.exchangeKey.hashValue] = oldInfo
    }
    
    func getPrice(tokenA: Token, tokenB: Token) -> Double {
        guard tokenA != tokenB else { return 1 }
        
        let index = Pair(tokenA, tokenB)
        let aToB = index.tokenA == tokenA
        
        guard let infos = prices[index]?.values else { return .infinity }
        let price = infos.map { info in
            return (aToB ? info.spotAB : info.spotBA) ?? 0
        }.reduce(0, { max($0, $1) })
        return price
    }
    
    func getReserves(tokenA: Token, tokenB: Token) -> [ReserveFeeInfo]? {
        let index = Pair(tokenA, tokenB)
        guard let values = prices[index]?.values else { return nil }
        guard values.count > 0 else { return nil }
        return Array(values)
    }
    
    var spotPicture: [Double] {
        let size = tokens.count
        guard size > 0 else { return [] }
        
        var flattenConversionRates = Array(repeating: Double.infinity, count: size * size)
        
        for i in 0..<flattenConversionRates.count {
            let row = i / size
            let col = i % size
            
            flattenConversionRates[i] = getPrice(tokenA: tokens[row], tokenB: tokens[col])
        }
        
        return flattenConversionRates
    }

}
