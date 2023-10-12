//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

public enum BotMessageType: String, Codable {
    case subscribe, unsubscribe, silent, reset, buy, update
}

public enum BotTopic: String, Codable, Sendable {
    case priceData, decision, reset, buy, environment, none
}
