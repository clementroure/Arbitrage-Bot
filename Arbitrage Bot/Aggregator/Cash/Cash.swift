//
//  Cash.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 04/07/2023.
//

import Foundation
import Euler

extension BN {
    var cash: Euler.BigInt {
        let n = (self * Euler.BigInt(10) ** 18).rounded()
//        n.decimals = 18
        return n
    }
    
    init(cash: Euler.BigInt) {
        self.init(cash, over: 10 ** 18)
    }
}
