//
//  BigUInt+Euler.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 27/06/2023.
//

import Foundation
import Euler
import BigInt

extension BigUInt {
    var euler: Euler.BigInt {
        return Euler.BigInt(sign: false, words: self.words.map { $0 })
    }
}

extension Web3BigInt {
    var euler: Euler.BigInt {
        let sign = self.sign == .minus
        return Euler.BigInt(sign: sign, words: self.words.map { $0 })
    }
}

extension Euler.BigInt {
    var asBigUInt: BigUInt {
        return BigUInt(words: self.words)
    }
}

extension Euler.BigDouble {
    var eth: BigUInt {
        return (self * 1e18).rounded().asBigUInt
    }
}
