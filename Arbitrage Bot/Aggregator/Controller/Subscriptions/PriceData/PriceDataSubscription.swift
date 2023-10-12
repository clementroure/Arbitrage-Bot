//
//  PriceDataSubscription.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import OpenCombine

class PriceDataSubscription {
    private let web3 = Credentials.shared.web3
    private let callback: (Result<(BotResponse, Int), Error>) -> Void
    internal let subscriptions = PriceDataSubscriptionState()
    
    internal var decisions = false
    internal var storeID: Int
    init(storeId: Int, callback: @escaping (Result<(BotResponse, Int), Error>) -> Void) {
        self.storeID = storeId
        self.callback = callback
        subscribeToNewHeads()
    }
    
    func dispatch(with type: PriceDataSubscriptionType, systemTime: UInt32) {
        guard subscriptions.activeSubscriptions.count > 0 else { return }
        Task {
            let clock = ContinuousClock()
            
            var responses = [(BotResponse, Int)]()
            
            let time = await clock.measure {
                responses = await self.subscriptions.meanPrice(for: .ethereumBlock, storeId: storeID)
            }
            
            for var response in responses {
                response.0.queryTime = time
                self.callback(.success(response))
            }
            
            print("Dispatched prices in \(time.ms)ms")
            
            // Dispatch to front-end
            if decisions {
                priceDataStores[storeID]?.dispatch(time: systemTime)
            }
        }
    }
    
    private func subscribeToNewHeads() {
        do {
            try web3.eth.subscribeToNewHeads { resp in
                print("Listening to new heads")
            } onEvent: { resp in
                guard let blockNumber = resp.result?.number?.quantity else { return }
                print("New block: \(blockNumber)")
                let time = Int(blockNumber)
                self.dispatch(with: .ethereumBlock, systemTime: UInt32(time))
            }
        } catch {
            print("Error: \(error.localizedDescription)")
            self.callback(.failure(error))
        }
    }
}

