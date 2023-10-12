//
//  BotRequest.swift
//
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

public struct BotRequest: Codable {
    public enum Environment: String, Codable {
        case development, production
    }
    
    public struct Query: Codable {
        public var exchange: String
        public var type: ExchangeType?
        public var tokenA: Token
        public var tokenB: Token
        public var amountIn: Double?
        public var amountOut: Double?
        public var routerAddress: String?
        public var factoryAddress: String?
    }
    
    public var type: BotMessageType
    public var topic: BotTopic
    public var environment: Environment
    public var query: Query?
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(BotMessageType.self, forKey: .type)
        topic = try container.decode(BotTopic.self, forKey: .topic)
        environment = try container.decodeIfPresent(Environment.self, forKey: .environment) ?? .production
        query = try container.decodeIfPresent(Query.self, forKey: .query)
    }
    

    enum DecodingError: LocalizedError {
        case dataCorrupted
        
        var errorDescription: String? {
            switch self {
            case .dataCorrupted:
                return "The data is corrupted"
            }
        }
    }

    public static func fromJSON(jsonString: String) throws -> BotRequest {
        let jsonData = jsonString.data(using: .utf8)
        guard let data = jsonData else { throw DecodingError.dataCorrupted }
        
        let decoder = JSONDecoder()
        let request = try decoder.decode(BotRequest.self, from: data)
        return request
    }
}
