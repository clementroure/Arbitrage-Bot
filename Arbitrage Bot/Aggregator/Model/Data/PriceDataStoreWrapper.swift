//
//  PriceDataStoreWrapper.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 26/06/2023.
//

import Foundation

class PriceDataStoreWrapper {
    internal var adjacencyList = AdjacencyList()
    
    var callback: (([Double], [Token], UInt32) -> Void)? = nil
    
    var publisher: PriceDataPublisher
    
    init(storeId: Int) {
        self.publisher = PriceDataPublisher(storeId: storeId)
    }
    
    static func createStore() -> Int {
        let id = priceDataStores.count
        let store = PriceDataStoreWrapper(storeId: id)
        priceDataStores[id] = store
        return id
    }
    
    func dispatch(time: UInt32) {
        guard let callback = self.callback else { return }
        Task {
            let spot = await self.adjacencyList.spotPicture // Take a picture of the price data store
            await callback(spot, self.adjacencyList.tokens, time)
        }
    }
}

var priceDataStores = [Int: PriceDataStoreWrapper]()
