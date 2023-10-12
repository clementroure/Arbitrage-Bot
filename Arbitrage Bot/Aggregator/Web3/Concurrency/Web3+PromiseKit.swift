//
//  Web3+PromiseKit.swift
//  Web3
//
//  Created by Koray Koska on 08.03.18.
//

import Foundation

public extension Web3 {
    
    func clientVersion() async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            self.clientVersion { response in
                response.sealContinuation(continuation)
            }
        }
    }
}

public extension Web3.Net {
    
    func version() async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            self.version { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func peerCount() async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.peerCount { response in
                response.sealContinuation(continuation)
            }
        }
    }
}

public extension Web3.Eth {
    
    func protocolVersion() async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            self.protocolVersion { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func syncing() async throws -> EthereumSyncStatusObject {
        try await withCheckedThrowingContinuation { continuation in
            self.syncing { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func mining() async throws -> Bool {
        try await withCheckedThrowingContinuation { continuation in
            self.mining { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func hashrate() async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.hashrate { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func gasPrice() async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.gasPrice { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func accounts() async throws -> [EthereumAddress] {
        try await withCheckedThrowingContinuation { continuation in
            self.accounts { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func blockNumber() async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.blockNumber { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getBalance(address: EthereumAddress, block: EthereumQuantityTag) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getBalance(address: address, block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getStorageAt(
        address: EthereumAddress,
        position: EthereumQuantity,
        block: EthereumQuantityTag
    ) async throws -> EthereumData {
        try await withCheckedThrowingContinuation { continuation in
            self.getStorageAt(address: address, position: position, block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }

    func getTransactionCount(address: EthereumAddress, block: EthereumQuantityTag) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getTransactionCount(address: address, block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getBlockTransactionCountByHash(blockHash: EthereumData) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getBlockTransactionCountByHash(blockHash: blockHash) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getBlockTransactionCountByNumber(block: EthereumQuantityTag) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getBlockTransactionCountByNumber(block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getUncleCountByBlockHash(blockHash: EthereumData) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getUncleCountByBlockHash(blockHash: blockHash) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getUncleCountByBlockNumber(block: EthereumQuantityTag) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.getUncleCountByBlockNumber(block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getCode(address: EthereumAddress, block: EthereumQuantityTag) async throws -> EthereumData {
        try await withCheckedThrowingContinuation { continuation in
            self.getCode(address: address, block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func sendRawTransaction(transaction: EthereumSignedTransaction) async throws -> EthereumData {
        try await withCheckedThrowingContinuation { continuation in
            do {
                try self.sendRawTransaction(transaction: transaction) { response in
                    response.sealContinuation(continuation)
                }
            } catch let error {
                continuation.resume(throwing: error)
            }
        }
    }
    
    func sendTransaction(transaction: EthereumTransaction) async throws -> EthereumData {
        try await withCheckedThrowingContinuation { continuation in
            self.sendTransaction(transaction: transaction) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func call(call: EthereumCall, block: EthereumQuantityTag) async throws -> EthereumData {
        try await withCheckedThrowingContinuation { continuation in
            self.call(call: call, block: block) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func estimateGas(call: EthereumCall) async throws -> EthereumQuantity {
        try await withCheckedThrowingContinuation { continuation in
            self.estimateGas(call: call) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getBlockByHash(blockHash: EthereumData, fullTransactionObjects: Bool) async throws -> EthereumBlockObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getBlockByHash(blockHash: blockHash, fullTransactionObjects: fullTransactionObjects) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getBlockByNumber(block: EthereumQuantityTag, fullTransactionObjects: Bool) async throws -> EthereumBlockObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getBlockByNumber(block: block, fullTransactionObjects: fullTransactionObjects) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getTransactionByHash(blockHash: EthereumData) async throws -> EthereumTransactionObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getTransactionByHash(blockHash: blockHash) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getTransactionByBlockHashAndIndex(blockHash: EthereumData, transactionIndex: EthereumQuantity) async throws -> EthereumTransactionObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getTransactionByBlockHashAndIndex(blockHash: blockHash, transactionIndex: transactionIndex) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getTransactionByBlockNumberAndIndex(block: EthereumQuantityTag, transactionIndex: EthereumQuantity) async throws -> EthereumTransactionObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getTransactionByBlockNumberAndIndex(block: block, transactionIndex: transactionIndex) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getTransactionReceipt(transactionHash: EthereumData) async throws -> EthereumTransactionReceiptObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getTransactionReceipt(transactionHash: transactionHash) { response in
                response.sealContinuation(continuation)
            }
        }
    }
    
    func getUncleByBlockHashAndIndex(blockHash: EthereumData, uncleIndex: EthereumQuantity) async throws -> EthereumBlockObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getUncleByBlockHashAndIndex(blockHash: blockHash, uncleIndex: uncleIndex) { response in
                response.sealContinuation(continuation)
            }
        }
    }

    func getUncleByBlockNumberAndIndex(
        block: EthereumQuantityTag,
        uncleIndex: EthereumQuantity
    ) async throws -> EthereumBlockObject? {
        try await withCheckedThrowingContinuation { continuation in
            self.getUncleByBlockNumberAndIndex(block: block, uncleIndex: uncleIndex) { response in
                response.sealContinuation(continuation)
            }
        }
    }

    func getLogs(
        addresses: [EthereumAddress]?,
        topics: [[EthereumData]]?,
        fromBlock: EthereumQuantityTag,
        toBlock: EthereumQuantityTag
    ) async throws -> [EthereumLogObject] {
        try await withCheckedThrowingContinuation { continuation in
            self.getLogs(addresses: addresses, topics: topics, fromBlock: fromBlock, toBlock: toBlock) { response in
                response.sealContinuation(continuation)
            }
        }
    }
}

fileprivate extension Web3Response {
    
    func sealContinuation<T>(_ continuation: CheckedContinuation<T, Swift.Error>) {
        if let result = result {
            continuation.resume(returning: result as! T)
        } else if let error = error {
            continuation.resume(throwing: error)
        }
    }
}
