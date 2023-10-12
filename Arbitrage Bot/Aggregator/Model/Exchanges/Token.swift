//
//  Token.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 29/06/2023.
//

import Foundation

public struct Token: Codable, Hashable, Sendable, Identifiable, Comparable, CustomStringConvertible {
    var name: String
    var address: EthereumAddress
    var decimals: Int = 18
    
    public init(name: String, address: EthereumAddress, decimals: Int = 18) {
        self.name = name
        self.address = address
        self.decimals = decimals
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try container.decode(String.self, forKey: .name)
        self.address = try container.decode(EthereumAddress.self, forKey: .address)
        self.decimals = try container.decodeIfPresent(Int.self, forKey: .decimals) ?? 18
    }
    
    
    public var id: Int {
        return address.hashValue
    }
    
    public static func < (lhs: Token, rhs: Token) -> Bool {
        return lhs.address < rhs.address
    }
    
    public var description: String {
        return name
    }
    
    static internal func fake(id: Int) -> Token {
        return Token(name: "TK\(id)", address: .init(id))
    }
}
