//
//  ArbitrageBuilder.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation

class Builder {
    var systemTime: Int = 0
    var steps: [BuilderStep] = []
    var lock = false
    
    func reset() {
        self.steps = []
    }
    
    func add(step: BuilderStep, with time: Int) {
        if time != systemTime {
            reset()
            self.systemTime = time
        }
        self.steps.append(step)
    }
}

extension AdjacencyList {
    func buildSteps(from order: [Int]) async throws -> BuilderStep {
        guard order.count > 1 else { throw BuilderStep.BuilderStepError.arrayTooSmall }
        
        let tokenA = tokens[order[0]]
        let tokenB = tokens[order[1]]
        let step = await BuilderStep(tokenA: tokenA, tokenB: tokenB, adjacencyList: self)
        
        if order.count > 2 {
            
            var current = step
            
            for i in 1..<order.count - 1 {
                let tokenIndexA = order[i]
                let tokenIndexB = order[i + 1]
                
                let tokenA = tokens[tokenIndexA]
                let tokenB = tokens[tokenIndexB]
                
                current.next = await BuilderStep(tokenA: tokenA, tokenB: tokenB, adjacencyList: self)
                current = current.next!
            }
        }
        
        return step
    }
}
