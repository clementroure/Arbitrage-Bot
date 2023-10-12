//
//  UniswapV2Pair.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import BigInt

public protocol UniswapV2PairContract: EthereumContract {
    func getReserves() -> SolidityInvocation
    func token0() -> SolidityInvocation
    func token1() -> SolidityInvocation
}

open class UniswapV2Pair: StaticContract, UniswapV2PairContract {
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

public extension UniswapV2PairContract {
    
    func getReserves() -> SolidityInvocation {
        let outputs = [
            SolidityFunctionParameter(name: "reserve0", type: .uint256),
            SolidityFunctionParameter(name: "reserve1", type: .uint256),
            SolidityFunctionParameter(name: "blockTimestampLast", type: .uint32)
        ]
        let method = SolidityConstantFunction(name: "getReserves", outputs: outputs, handler: self)
        return method.invoke()
    }
    
    func token0() -> SolidityInvocation {
        let output = SolidityFunctionParameter(name: "token0", type: .address)
        let method = SolidityConstantFunction(name: "token0", outputs: [output], handler: self)
        return method.invoke()
    }
    
    func token1() -> SolidityInvocation {
        let output = SolidityFunctionParameter(name: "token1", type: .address)
        let method = SolidityConstantFunction(name: "token1", outputs: [output], handler: self)
        return method.invoke()
    }
}

