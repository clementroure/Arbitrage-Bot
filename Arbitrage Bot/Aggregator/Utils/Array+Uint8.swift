//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
extension String {
    var drop0x: String {
        return self.hasPrefix("0x") ? String(self.dropFirst(2)) : self
    }
}

extension Data {
    init(hex: String) {
        self.init(Array<UInt8>(hex: hex))
    }
    
    func toHexString() -> String {
        return self.map { String(format: "%02x", $0) }.joined()
    }
}

extension Array where Element == UInt8 {
    init(hex: String) {
        self.init()
        let hex = hex.drop0x
        var startIndex = hex.startIndex
        while startIndex < hex.endIndex {
            let endIndex = hex.index(after: hex.index(after: startIndex))
            let bytes = hex[startIndex..<endIndex]
            if let byte = UInt8(bytes, radix: 16) {
                self.append(byte)
            } else {
                fatalError("Invalid hex string")
            }
            startIndex = endIndex
        }
    }
}
