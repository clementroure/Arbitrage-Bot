//
//  SwapRouteCoordinator.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation
import BigInt

struct Step {
    let intermediary: EthereumAddress;
    let token: EthereumAddress;
    let tokenName: String;
    let data: EthereumAddress;
    let exchangeName: String;
}


protocol SwapRouteCoordinatorContract: EthereumContract {
    func startArbitrage(startAmount: BigUInt, lapExchange: EthereumAddress, steps: [Step]) -> SolidityInvocation
}

open class SwapRouteCoordinator: StaticContract, SwapRouteCoordinatorContract {
    public var address: EthereumAddress?
    public let eth: Web3.Eth
    
    open var constructor: SolidityConstructor?
    
    open var events: [SolidityEvent] {
        return [
            SolidityEvent(name: "Arbitrage", anonymous: false, inputs: [
                .init(name: "amountOut", type: .uint256, indexed: false)
            ])
        ]
    }
    
    public required init(address: EthereumAddress?, eth: Web3.Eth) {
        self.address = address ?? swapCoordinatorDevAddress
        self.eth = eth
    }
}

extension SwapRouteCoordinatorContract {
    internal func initiateArbitrage(startAmount: BigUInt, lapExchange: EthereumAddress, intermediaries: [EthereumAddress], tokens: [EthereumAddress], data: [EthereumAddress]) -> SolidityInvocation {
        let inputs = [
            SolidityFunctionParameter(name: "startAmount", type: .uint256),
            SolidityFunctionParameter(name: "lapExchange", type: .address),
            SolidityFunctionParameter(name: "intermediaries", type: .array(type: .address, length: nil)),
            SolidityFunctionParameter(name: "tokens", type: .array(type: .address, length: nil)),
            SolidityFunctionParameter(name: "data", type: .array(type: .address, length: nil))
        ]
        
        let method = SolidityNonPayableFunction(name: "initiateArbitrage", inputs: inputs, handler: self)
        
        return method.invoke(startAmount, lapExchange, intermediaries, tokens, data)
    }
    
    func startArbitrage(startAmount: BigUInt, lapExchange: EthereumAddress, steps: [Step]) -> SolidityInvocation {
        // Separate Step objects into their components
        let intermediaries = steps.map { $0.intermediary }
        let tokens = steps.map { $0.token }
        let data = steps.map { $0.data }
        
        // Call initiateArbitrage with separated arrays
        return initiateArbitrage(startAmount: startAmount, lapExchange: lapExchange, intermediaries: intermediaries, tokens: tokens, data: data)
    }
}
