//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation

extension EthereumAddress {
    static let zero = try! EthereumAddress(hex: "0x0000000000000000000000000000000000000000", eip55: false)
    static var random: EthereumAddress {
        guard let random = try? EthereumPrivateKey() else { return .zero }
        return random.address
    }
    
    init(_ n: Int) {
        // First we map n into an array of [UInt8]
        var bytes = [UInt8]()
        var n = n
        while n > 0 {
            bytes.append(UInt8(n % 256))
            n /= 256
        }
        // Then we pad it with zeros to make it 20 bytes long
        while bytes.count < 20 {
            bytes.append(0)
        }
        // Then we create an EthereumAddress from it
        try! self.init(bytes)
    }
}

extension EthereumAddress: Comparable {
    public static func < (lhs: EthereumAddress, rhs: EthereumAddress) -> Bool {
        for i in 0..<lhs.rawAddress.count {
            guard lhs.rawAddress[i] != rhs.rawAddress[i] else { continue }
            return lhs.rawAddress[i] < rhs.rawAddress[i]
        }
        return false
    }
}
