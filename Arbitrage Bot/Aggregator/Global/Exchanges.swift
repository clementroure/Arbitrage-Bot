//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

struct ExchangeInfo: Codable {
    let name: String
    let type: String
    var adapter: String? = nil
    var routerAddress: EthereumAddress? = nil
    var factoryAddress: EthereumAddress? = nil
    var coordinatorAddress: EthereumAddress? = nil
    var testnet: Bool? = nil
}

public struct ExchangeMetadata {
    let name: String
    var exchange: any Exchange
    var path: KeyPath<ExchangesList, Self>! = nil {
        didSet {
            exchange.path = path
        }
    }
    
    init(name: String, exchange: any Exchange) {
        self.name = name
        self.exchange = exchange
    }
}

public struct ExchangesList {
    static let shared = ExchangesList()
    
    struct Development {
        var uniswap = ExchangeMetadata(name: "uniswap", exchange: UniswapV2(
            router: try! EthereumAddress(hex: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20", eip55: false),
            factory: try! EthereumAddress(hex: "0xADf1687e201d1DCb466D902F350499D008811e84", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x69FBa73a3D24A538f7E10eE0190B7Dc8Bb332fdF", eip55: false),
            fee: 3
        ))
        
        var pancakeswap = ExchangeMetadata(name: "pancakeswap", exchange: UniswapV2(
            router: try! EthereumAddress(hex: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1", eip55: false),
            factory: try! EthereumAddress(hex: "0x6725F303b657a9451d8BA641348b6761A6CC7a17", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x69FBa73a3D24A538f7E10eE0190B7Dc8Bb332fdF", eip55: false),
            fee: 2
        ))
        
        var apeswap = ExchangeMetadata(name: "apeswap", exchange: UniswapV2(
            router: try! EthereumAddress(hex: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B", eip55: false),
            factory: try! EthereumAddress(hex: "0x5722F3b02b9fe2003b3045D73E9230684707B257", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x69FBa73a3D24A538f7E10eE0190B7Dc8Bb332fdF", eip55: false),
            fee: 3
        ))
        
        init() {
            uniswap.path = \.development.uniswap
            pancakeswap.path = \.development.pancakeswap
            apeswap.path = \.development.apeswap
        }

        subscript(key: String) -> (any Exchange)? {
            let mirror = Mirror(reflecting: self)
            for child in mirror.children {
                if child.label == key {
                    guard let meta = child.value as? ExchangeMetadata else { return nil }
                    return meta.exchange
                }
            }
            return nil
        }
    }

    struct Production {
        var uniswap = ExchangeMetadata(name: "uniswap", exchange: UniswapV2(
            router: try! EthereumAddress(hex: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", eip55: false),
            factory: try! EthereumAddress(hex: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x69FBa73a3D24A538f7E10eE0190B7Dc8Bb332fdF", eip55: false),
            fee: 3
        ))
        
//        var uniswap3 = ExchangeMetadata(name: "uniswap3", exchange: )
        
        
        init() {
            uniswap.path = \.production.uniswap
        }
        
        subscript(key: String) -> (any Exchange)? {
            let mirror = Mirror(reflecting: self)
            for child in mirror.children {
                if child.label == key {
                    guard let meta = child.value as? ExchangeMetadata else { return nil }
                    return meta.exchange
                }
            }
            return nil
        }
    }
    
    subscript(environment: BotRequest.Environment, name: String) -> (any Exchange)? {
        switch environment {
        case .development:
            return development[name]
        case .production:
            return production[name]
        }
    }
    
    let development = Development()
    let production = Production()
}

// MARK: - Uniswap V2 Constants
let UniswapV2PairHash: [UniType: [UInt8]] = [
    .apeswap: Array<UInt8>(hex: "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"),
    .pancakeswap: Array<UInt8>(hex: "0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66"),
    .uniswap: Array<UInt8>(hex: "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f")
]

let UniswapV3PairHash: [UniType: [UInt8]] = [
    .uniswap: Array<UInt8>(hex: "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54")
]

enum UniType: String {
    case apeswap = "apeswap"
    case pancakeswap = "pancakeswap"
    case uniswap = "uniswap"
}

struct UniswapV2Exchange {
    let name: UniType
    let routerAddress: EthereumAddress
    let factoryAddress: EthereumAddress
}

// MARK: - Grand Swap Coordinator

let swapCoordinatorDevAddress = EthereumAddress(hexString: "0xa766C3452CA12e7f1Fc136b790d03dAEB26b9E05")
