//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation


public class Credentials {
    static let shared = try! Credentials()
    
    let testnetWeb3: Web3
    let productionWeb3: Web3
    
    var environment: BotRequest.Environment = .production {
        didSet {
            print("Environment: \(environment.rawValue)")
        }
    }
    
    var web3: Web3 {
        switch environment {
        case .development:
            return testnetWeb3
        case .production:
            return productionWeb3
        }
    }
    
    let privateWallet: EthereumPrivateKey
    
    enum EnvironmentError: Error {
        case undefinedVariable
    }
    
    init() throws {
        guard let testnetJsonRPC = Environment.get("TESTNET_JSON_RPC_URL") else { throw EnvironmentError.undefinedVariable }
        guard let productionJsonRPC = Environment.get("JSON_RPC_URL") else { throw EnvironmentError.undefinedVariable }
        self.testnetWeb3 = try Web3(wsUrl: testnetJsonRPC)
        self.productionWeb3 = try Web3(wsUrl: productionJsonRPC)
        
        guard let privateKey = Environment.get("WALLET_PRIVATE_KEY") else { throw EnvironmentError.undefinedVariable }
        self.privateWallet = try EthereumPrivateKey(hexPrivateKey: privateKey)
        
        let provider = web3.provider as! Web3WebSocketProvider
        print("Connected to \(provider.wsUrl)")
        
        print("Using Wallet: \(self.privateWallet.address.hex(eip55: false))")
    }
}
