//
//  ProcessOpportunities.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import CollectionConcurrencyKit

extension Builder {
    func process(systemTime: Int) {
        guard self.lock == false else { return }
        guard self.systemTime == systemTime else {
            print(self.systemTime, systemTime)
            return
        }
        self.lock = true
        Task {
            // It's okay to do that, because we start from a single node
            let all = await self.steps.concurrentCompactMap { step in
                try? step.optimalPrice()
            }
            
            let bestOpportunity = all
                .reduce(BuilderStep.OptimumResult(amountIn: .zero, amountOut: .zero, path: []), {
                    max($0.amountOut, $1.amountOut) == $0.amountOut ? $0 : $1
                })
            
            var amountIn = bestOpportunity.amountIn
            amountIn.decimals = 18
            
            print(bestOpportunity.path.map { "\($0.token) -> " })
            
            print("Best: \(amountIn) -> \(bestOpportunity.amountOut)")
            
            try await DecisionDataPublisher.shared.coordinator.coordinateFlashSwapArbitrage(with: bestOpportunity)
            self.lock = false
        }
    }
}
