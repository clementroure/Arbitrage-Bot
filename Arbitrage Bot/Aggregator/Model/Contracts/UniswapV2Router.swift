//
//  UniswapV2Router.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import BigInt

public protocol UniswapV2RouterContract: EthereumContract {
    func swapExactTokensForTokens(amountIn: BigUInt, amountOutMin: BigUInt, path: [EthereumAddress], to: EthereumAddress, deadline: BigUInt) -> SolidityInvocation
}

open class UniswapV2Router: StaticContract, UniswapV2RouterContract {
    public var address: EthereumAddress?
    public let eth: Web3.Eth
    
    open var constructor: SolidityConstructor?
    
    open var events: [SolidityEvent] {
        return []
    }
    
    public required init(address: EthereumAddress?, eth: Web3.Eth) {
        self.address = address
        self.eth = eth
    }
}

public extension UniswapV2RouterContract {
    
    func swapExactTokensForTokens(amountIn: BigUInt, amountOutMin: BigUInt, path: [EthereumAddress], to: EthereumAddress, deadline: BigUInt) -> SolidityInvocation {
        let inputs = [
            SolidityFunctionParameter(name: "amountIn", type: .uint256),
            SolidityFunctionParameter(name: "amountOutMin", type: .uint256),
            SolidityFunctionParameter(name: "path", type: .array(type: .address, length: 2)),
            SolidityFunctionParameter(name: "to", type: .address),
            SolidityFunctionParameter(name: "deadline", type: .uint256)
        ]
        
        let method = SolidityNonPayableFunction(name: "swapExactTokensForTokens", inputs: inputs, handler: self)
        return method.invoke(amountIn, amountOutMin, path, to, deadline)
    }
}
