//
//  Trade.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 12/07/2023.
//

import Foundation

struct Trade: Codable, Sendable {
    var timestamp: Date
    var token: String
    var startAmount: Double
    var route: [Route]
    
    struct Route: Codable, Sendable {
        var exchange: String
        var token: String
    }
    
    var profit: Double
    var fees: Double?
    var txHash: String?
}
