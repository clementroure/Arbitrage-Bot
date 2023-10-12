//
//  ContractPromiseExtensions.swift
//  BigInt
//
//  Created by Koray Koska on 23.06.18.
//

import Collections

// MARK: - Extensions

public extension SolidityInvocation {
    
    func call(block: EthereumQuantityTag = .latest) async throws -> [String: Any] {
        return try await withCheckedThrowingContinuation { continuation in
            self.call(block: block) { result, error in
                guard error == nil else { return continuation.resume(throwing: error!) }
                continuation.resume(returning: result ?? [:])
            }
        }
    }
    
    func send(
        nonce: EthereumQuantity? = nil,
        gasPrice: EthereumQuantity? = nil,
        maxFeePerGas: EthereumQuantity? = nil,
        maxPriorityFeePerGas: EthereumQuantity? = nil,
        gasLimit: EthereumQuantity? = nil,
        from: EthereumAddress,
        value: EthereumQuantity? = nil,
        accessList: OrderedDictionary<EthereumAddress, [EthereumData]> = [:],
        transactionType: EthereumTransaction.TransactionType = .legacy
    ) async throws -> EthereumData {
        return try await withCheckedThrowingContinuation { continuation in
            self.send(
                nonce: nonce,
                gasPrice: gasPrice,
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                gasLimit: gasLimit,
                from: from,
                value: value,
                accessList: accessList,
                transactionType: transactionType) { result, error in
                    guard error == nil else { return continuation.resume(throwing: error!) }
                    continuation.resume(returning: result ?? .init([]))
                }
        }
    }
    
    func estimateGas(from: EthereumAddress? = nil, gas: EthereumQuantity? = nil, value: EthereumQuantity? = nil) async throws -> EthereumQuantity {
        return try await withCheckedThrowingContinuation { continuation in
            self.estimateGas(from: from, gas: gas, value: value) { result, error in
                guard error == nil else { return continuation.resume(throwing: error!) }
                continuation.resume(returning: result ?? .bytes([]))
            }
        }
    }
}

public extension SolidityConstructorInvocation {
    
    func send(
        nonce: EthereumQuantity? = nil,
        gasPrice: EthereumQuantity? = nil,
        maxFeePerGas: EthereumQuantity? = nil,
        maxPriorityFeePerGas: EthereumQuantity? = nil,
        gasLimit: EthereumQuantity? = nil,
        from: EthereumAddress,
        value: EthereumQuantity? = nil,
        accessList: OrderedDictionary<EthereumAddress, [EthereumData]> = [:],
        transactionType: EthereumTransaction.TransactionType = .legacy
    ) async throws -> EthereumData {
        return try await withCheckedThrowingContinuation { continuation in
            self.send(
                nonce: nonce,
                gasPrice: gasPrice,
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                gasLimit: gasLimit,
                from: from,
                value: value,
                accessList: accessList,
                transactionType: transactionType) { result, error in
                    guard error == nil else { return continuation.resume(throwing: error!) }
                    continuation.resume(returning: result ?? .init([]))
                }
        }
    }
}
