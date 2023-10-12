//
//  OptimalPrice.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import Euler

extension BuilderStep {
    enum PriceCalculationError: LocalizedError {
        case noSolutions

        var errorDescription: String? {
            switch self {
            case .noSolutions:
                return "No solutions found"
            }
        }
    }
    
    struct OptimumResult {
        let amountIn: Euler.BigInt
        let amountOut: Euler.BigInt
        let path: [Step]
    }
    
    func optimalPrice() throws -> OptimumResult {
        let precision: BN = 1
        let interval: (BN, BN) = (0, 10000)
        
        func f(_ x: BN) throws -> BN {
            let a = try self.price(for: x.cash).0
            let b = try self.price(for: (x + precision).cash).0
      
            let dev = BN(cash: b - a) / precision
       
            return dev - 1 // We target dy/dx = 1 for optimal output
        }
        
        var (a, b) = interval
        
        var fa = try f(a)
        var fb = try f(b)
        
        guard fa * fb < BigDouble.zero else {
            throw PriceCalculationError.noSolutions
        }
        if abs(fa) < abs(fb) {
            (a, b) = (b, a) // Switch values
        }
        
        var c = a
        var fc = try f(c)
        var mflag = true
        var d = BigDouble.zero
        
        func isBetween(x: BigDouble, _ a: BigDouble, _ b: BigDouble) -> Bool {
            guard x >= a else { return false }
            guard x <= b else { return false }
            return true
        }
        
        while fb != 0 && abs(b - a) > precision {
            var s = BigDouble.zero
            if fa != fc && fb != fc {
                let p1 = (a * fb * fc) / ((fa - fb) * (fa - fc))
                let p2 = (b * fa * fc) / ((fb - fa) * (fb - fc))
                let p3 = (c * fa * fb) / ((fc - fa) * (fc - fb))
                s = p1 + p2 + p3
            } else {
                s = b - (fb * (b - a)) / (fb - fa)
            }
            
            if (isBetween(x: s, (3*a + b) / 4, b) ||
                (mflag == true && abs(s - b) >= abs(b - c)  / BigDouble(2)) ||
                (mflag == false && abs(s - b) >= abs(c - d) / BigDouble(2))) {
                s = (a + b) / BigDouble(2)
                
                mflag = true
            } else {
                mflag = false
            }
            
            let fs = try f(s)
            d = c
            c = b
            // Recompute
            fa = try f(a)
            fb = try f(b)
            fc = try f(c)
            
            if fa * fs < BigDouble.zero {
                b = s
            } else {
                a = s
            }
            
            if abs(fa) < abs(fb) {
                (a, b) = (b, a) // Switch values
            }
        }
        
        var out = try self.price(for: b.cash)
        out.0.decimals = 18
        var amountIn = b.cash
        amountIn.decimals = 18
        return OptimumResult(amountIn: amountIn, amountOut: out.0, path: out.1)
    }
}
