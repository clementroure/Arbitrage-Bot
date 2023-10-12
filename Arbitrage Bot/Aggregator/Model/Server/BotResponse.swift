//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

public struct BotResponse: Sendable, Codable {
    public enum Status: String, Codable, Sendable {
        case success
        case error
    }
    
    public let status: Status
    public let topic: BotTopic
    public var error: String? = nil
    public var queryTime: Duration? = nil
    var quote: Quote? = nil
    var executedTrade: Trade? = nil
    
    public init(status: Status, topic: BotTopic, error: String? = nil) {
        self.status = status
        self.topic = topic
        self.error = error
    }
    
    enum EncodingError: LocalizedError {
        case dataCorrupted
        case invalidValue
        case unknown
        
        var errorDescription: String? {
            switch self {
            case .dataCorrupted:
                return "Data corrupted"
            case .invalidValue:
                return "Invalid value"
            case .unknown:
                return "Unknown error"
            }
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(self.status, forKey: .status)
        try container.encode(self.topic, forKey: .topic)
        try container.encodeIfPresent(self.error, forKey: .error)
        try container.encodeIfPresent(self.queryTime?.ms, forKey: .queryTime)
        try container.encodeIfPresent(self.quote, forKey: .quote)
        try container.encodeIfPresent(self.executedTrade, forKey: .executedTrade)
    }

    public func toJSON() throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        encoder.dateEncodingStrategy = .millisecondsSince1970
        let data = try encoder.encode(self)
        guard let json = String(data: data, encoding: .utf8) else {
            throw EncodingError.unknown
        }
        return json
    }
}

extension Duration {
    var ms: Double {
        let atto_ms = Double(self.components.attoseconds) * 1e-15
        let seco_ms = Double(self.components.seconds) * 1e3
        return atto_ms + seco_ms
    }
}
