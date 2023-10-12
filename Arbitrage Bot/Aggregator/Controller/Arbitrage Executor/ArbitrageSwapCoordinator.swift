//
//  ArbitrageSwapCoordinator.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation
import Euler

class ArbitrageSwapCoordinator {
    
    func coordinateFlashSwapArbitrage(with optimum: BuilderStep.OptimumResult) async throws {
        let contract = Credentials.shared.web3.eth.Contract(type: SwapRouteCoordinator.self)
        let invocation = contract.startArbitrage(startAmount: optimum.amountIn.asBigUInt,
                                                 lapExchange: optimum.path[0].intermediary, // First must be the lap
                                                 steps: optimum.path)
        let from = Credentials.shared.privateWallet.address
        let gasPrice = try await Credentials.shared.web3.eth.gasPrice()
        let nonce = try await Credentials.shared.web3.eth.getTransactionCount(address: from, block: .latest)
        let tx = invocation.createTransaction(nonce: nonce,
                                              gasPrice: gasPrice,
                                              maxFeePerGas: EthereumQuantity(quantity: 20.gwei),
                                              maxPriorityFeePerGas: nil,
                                              gasLimit: 1000000,
                                              from: from,
                                              value: 0,
                                              accessList: .init(),
                                              transactionType: .legacy)
        guard let signed = try tx?.sign(with: Credentials.shared.privateWallet, chainId: 97) else { return }
        
        // MARK: - Dispatch Decision
        var response = BotResponse(status: .success, topic: .decision)
        guard let first = optimum.path.first?.token else { return }
        guard let token = TokenList.values.first(where: { $0.address == first }) else { return }
        response.executedTrade = Trade(timestamp: .now,
                                       token: token.name,
                                       startAmount: (BN(optimum.amountIn) / 1e18).asDouble() ?? 0,
                                       route: optimum.path.map { step in
                                            Trade.Route(exchange: step.exchangeName, token: step.tokenName)
                                       },
                                       profit: (BN(optimum.amountOut - optimum.amountIn) / 1e18).asDouble() ?? 0
                                       )
        
        DecisionDataPublisher.shared.publishDecision(decision: response)
        
        let txHash = try await Credentials.shared.web3.eth.sendRawTransaction(transaction: signed)
        
        // Let's wait for the transaction to be mined
        try await Task.sleep(nanoseconds: 10_000_000_000) // 10 second should be enough
        
        // Get the transaction fees
        let receipt = try await Credentials.shared.web3.eth.getTransactionReceipt(transactionHash: txHash)
        
        let events = contract.events.compactMap { try! EthereumData(ethereumValue: $0.signature.sha3(.keccak256) )}
        
        let logs: [EthereumLogObject] = receipt?
            .logs
            .filter { events.contains($0.topics) } ?? []
        
        guard let amountOut = logs
            .first?
            .data
            .ethereumValue()
            .ethereumQuantity?
            .quantity else { return }
        
        
        if let profit = (BigDouble(amountOut.euler) / 1e18).asDouble() {
            response.executedTrade?.profit = profit
        }
        response.executedTrade?.txHash = txHash.hex()
        if let gasUsed = receipt?.cumulativeGasUsed {
            response.executedTrade?.fees = (BN((gasUsed.quantity * gasPrice.quantity).euler) / 1e18).asDouble()
        }
        
        DecisionDataPublisher.shared.publishDecision(decision: response)
    }
}
