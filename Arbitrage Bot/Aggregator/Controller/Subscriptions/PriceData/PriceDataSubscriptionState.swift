//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

public struct PriceDataActiveSubscription: Hashable {
    var exchangeKey: String
    var environment: BotRequest.Environment
    var pair: PairInfo
    
    public init(exchangeKey: String, environment: BotRequest.Environment, pair: PairInfo) {
        self.exchangeKey = exchangeKey
        self.environment = environment
        self.pair = pair
    }
}

final class PriceDataSubscriptionState {
    var activeSubscriptions = Set<PriceDataActiveSubscription>() {
        didSet {
            if oldValue.count != activeSubscriptions.count {
                print("Updated subscriber count: \(activeSubscriptions.count)")
            }
        }
    }
    
    func meanPrice(for type: PriceDataSubscriptionType, storeId: Int) async -> [(BotResponse, Int)] {
        return await withTaskGroup(of: Optional<(BotResponse, Int)>.self, returning: [(BotResponse, Int)].self) { taskGroup in
            let subs: [(any Exchange, PairInfo, Int)] = activeSubscriptions.compactMap { activeSubscription in
                guard let adapter = ExchangesList.shared[activeSubscription.environment, activeSubscription.exchangeKey] else { return nil }
                guard adapter.trigger == type else { return nil }
                return (adapter, activeSubscription.pair, activeSubscription.hashValue)
            }
            
            for (exchange, pair, hash) in subs {
                taskGroup.addTask {
                    do {
                        let price = try await self.meanPrice(for: exchange, with: pair, storeId: storeId)
                        // Return
                        return (price, hash)
                    } catch {
                        print("Error with \(pair)")
                        let res = BotResponse(status: .error, topic: .priceData, error: error.localizedDescription)
                        return (res, hash)
                    }
                }
            }
            
            return await taskGroup.reduce(into: [(BotResponse, Int)]()) { partialResult, result in
                if let result = result {
                    partialResult.append(result)
                }
            }
        }
    }
    
    func meanPrice<T: Exchange>(for exchange: T, with pair: PairInfo, storeId: Int) async throws -> BotResponse {
        let meanPrice = try await exchange.meanPrice(storeId: storeId, tokenA: pair.tokenA, tokenB: pair.tokenB)

        var response = BotResponse(status: .success, topic: .priceData)
        response.quote = meanPrice
        return response
    }
}
