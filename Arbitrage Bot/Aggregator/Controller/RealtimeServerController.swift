//
//  RealtimeServerController.swift
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

import Foundation


class RealtimeServerController {
    var callback: (String) -> Void
    var priceSubscriber: PriceDataSubscriber
    
    var decisionSubscriber: DecisionDataSubscriber
    var storeId: Int
    var id: Int
    
    public init(id: Int, storeId: Int, callback: @escaping (String) -> Void) {
        self.id = id
        self.storeId = storeId
        self.callback = callback
        
        self.decisionSubscriber = DecisionDataSubscriber { res in
            guard let str = try? res.toJSON() else { return }
            if controllers.keys.contains(id) {
                callback(str)
            }
        }
        self.priceSubscriber = PriceDataSubscriber(storeId: storeId) { res in
            guard let str = try? res.toJSON() else { return }
            if controllers.keys.contains(id) {
                callback(str)
            }
        }
        
        
        // Publishers
        DecisionDataPublisher.shared.receive(subscriber: decisionSubscriber)
        priceDataStores[storeId]?.publisher.receive(subscriber: priceSubscriber)
    }

    // MARK: - Request
    func handleRequest(request: String) throws {
        let botRequest = try BotRequest.fromJSON(jsonString: request)
        
        let response: BotResponse
        
        switch botRequest.topic {
        case .priceData:
            response = priceData(request: botRequest)
        case .decision:
            response = decision(request: botRequest)
        case .reset:
            response = reset(request: botRequest)
        case .buy:
            response = buy(request: botRequest)
        case .environment:
            response = environment(request: botRequest)
        case .none:
            response = BotResponse(status: .success, topic: .none)
        }
        
        self.callback(try response.toJSON())
    }
    
    func priceData(request: BotRequest) -> BotResponse {
        guard let query = request.query else {
            return BotResponse(status: .error, topic: .priceData)
        }
        let pair = PairInfo(tokenA: query.tokenA, tokenB: query.tokenB)
        
        let activeSub = PriceDataActiveSubscription(exchangeKey: query.exchange,
                                                    environment: request.environment,
                                                    pair: pair)
        
        if request.type == .subscribe {
            self.priceSubscriber.activeSubscriptions.append(activeSub)
        } else {
            self.priceSubscriber.activeSubscriptions.removeAll { sub in
                activeSub == sub
            }
            Task {
                // Clear the pair price
                await priceDataStores[storeId]?
                    .adjacencyList
                    .remove(pair: .init(query.tokenA, query.tokenB))
            }
        }
        
        return BotResponse(status: .success, topic: .priceData)
    }
    
    func decision(request: BotRequest) -> BotResponse {
        if request.type == .subscribe {
            priceDataStores[storeId]?.publisher.priceDataSubscription.decisions = true
        } else {
            priceDataStores[storeId]?.publisher.priceDataSubscription.decisions = false
        }
        
        return BotResponse(status: .success, topic: .decision)
    }
    
    func reset(request: BotRequest) -> BotResponse {
        // Restart the server
        self.priceSubscriber.activeSubscriptions.removeAll()
        priceDataStores[storeId]?
            .publisher
            .priceDataSubscription
            .subscriptions
            .activeSubscriptions
            .removeAll()
        
        return BotResponse(status: .success, topic: .reset)
    }
    
    func buy(request: BotRequest) -> BotResponse {
        return BotResponse(status: .error, topic: .buy)
    }
    
    func environment(request: BotRequest) -> BotResponse {
        Credentials.shared.environment = request.environment
        return BotResponse(status: .error, topic: .environment)
    }
}

/// Wrapper for C api.
class RealtimeServerControllerWrapper {
    // For simplicity in this example, I will assume that
    // the callback takes a C string.
    internal var serverController: RealtimeServerController
    
    init(id: Int, storeId: Int, userData: UnsafeRawPointer, callback: @escaping (@convention(c) (UnsafePointer<CChar>, UInt16, UnsafeRawPointer) -> Void)) {
        self.serverController = RealtimeServerController(id: id, storeId: storeId, callback: { message in
            let message = message
            message.withCString { cMessage in
                callback(cMessage, UInt16(message.count), userData)
            }
        })
    }
    
    public func handleRequest(request: String, completion: @escaping (Error) -> Void) {
        do {
            try serverController.handleRequest(request: request)
        } catch {
            completion(error)
        }
    }
}


// To mimic a reference to the class we can use a Dictionary
var controllers: [Int: RealtimeServerControllerWrapper] = [:]
