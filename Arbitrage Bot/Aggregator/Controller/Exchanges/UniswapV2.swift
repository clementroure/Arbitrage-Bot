//
//  File.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import Euler
import BigInt
final class UniswapV2: Exchange {
    typealias Delegate = UniswapV2Router

    typealias Meta = RequiredPriceInfo

    var type: ExchangeType

    var trigger: PriceDataSubscriptionType


    struct RequiredPriceInfo: Codable {
        let routerAddress: EthereumAddress;
        let factoryAddress: EthereumAddress;
        let reserveA: Euler.BigInt;
        let reserveB: Euler.BigInt;
    }

    var path: KeyPath<ExchangesList, ExchangeMetadata>!
    var name: String {
        ExchangesList.shared[keyPath: self.path].name
    }

    var fee: Euler.BigInt = 3

    var delegate: UniswapV2Router
    var factory: EthereumAddress
    var coordinator: EthereumAddress?

    init(router: EthereumAddress, factory: EthereumAddress, coordinator: EthereumAddress, fee: Euler.BigInt) {
        self.delegate = UniswapV2Router(address: router, eth: Credentials.shared.web3.eth)
        self.factory = factory
        self.coordinator = coordinator
        let wethAddressEnv = Environment.get("WETH_CONTRACT_ADDRESS") ??
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        self.wethAddress = try! EthereumAddress(hex: wethAddressEnv, eip55: false)

        self.type = .dex
        self.trigger = .ethereumBlock
        self.fee = fee
    }

    // MARK: - Error
    enum UniswapV2Error: LocalizedError {
        case identicalAddresses
        case zeroAddress
        case pairForEncodeIssue
        case getReserveIssue(EthereumAddress)
        case insufficientInputAmount
        case insufficientLiquidity

        var errorDescription: String? {
            switch self {
            case .identicalAddresses:
                return "Token addresses must be different."
            case .zeroAddress:
                return "Token address must not be the zero address."
            case .pairForEncodeIssue:
                return "Encountered a problem while computing the pair address"
            case .getReserveIssue(let address):
                return "Encountered a problem while fetching the reserves for pair \(address.hex(eip55: false))"
            case .insufficientInputAmount:
                return "Insufficient input amount"
            case .insufficientLiquidity:
                return "Insufficient liquidity"
            }
        }
    }

    // MARK: - Info

    var intermediaryStepData: EthereumAddress? {
        self.delegate.address
    }

    // MARK: - Contract Methods
    var wethAddress: EthereumAddress

    func normalizeToken(token: Token) -> Token {
        if token.address == .zero {
            return Token(name: "WETH", address: wethAddress)
        }
        return token
    }

    func sortTokens(tokenA: EthereumAddress, tokenB: EthereumAddress) throws -> (EthereumAddress, EthereumAddress) {
        if tokenA == tokenB {
            throw UniswapV2Error.identicalAddresses
        }
        let (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA)
        if token0 == .zero {
            throw UniswapV2Error.zeroAddress
        }
        return (token0, token1)
    }

    func pairFor(factory: EthereumAddress, tokenA: EthereumAddress, tokenB: EthereumAddress) throws -> EthereumAddress {
        let (token0, token1) = try sortTokens(tokenA: tokenA, tokenB: tokenB)
        guard let initCodeHash = UniswapV2PairHash[UniType(rawValue: self.name) ?? .uniswap] else { // UniswapV2 Pair init code hash
            throw UniswapV2Error.pairForEncodeIssue
        }

        var concat = token0.rawAddress
        concat.append(contentsOf: token1.rawAddress)

        let salt = concat.sha3(.keccak256)

        let create2 = try EthereumUtils.getCreate2Address(from: factory, salt: salt, initCodeHash: initCodeHash)

        return create2
    }

    func getReserves(
        factory: EthereumAddress,
        tokenA: EthereumAddress,
        tokenB: EthereumAddress
    ) async throws -> (Euler.BigInt, Euler.BigInt) {
        let computedPair = try pairFor(factory: factory, tokenA: tokenA, tokenB: tokenB)
        let pair = Credentials.shared.web3.eth.Contract(type: UniswapV2Pair.self, address: computedPair)
        let invocation: [String: Any] = try await withCheckedThrowingContinuation { continuation in
            pair.getReserves().call { result, e in
                if let error = e {
                    print("Pair \(tokenA.hex(eip55: false))-\(tokenB.hex(eip55: false)) does not exist on \(factory.hex(eip55: false)))")
                    print("Pair address: \(computedPair.hex(eip55: false))")
                    return continuation.resume(throwing: error)
                }
                continuation.resume(returning: result ?? [:])
            }
        }

        guard let reserve0 = invocation["reserve0"] as? Web3BigUInt else {
            throw UniswapV2Error.getReserveIssue(computedPair)
        }
        guard  let reserve1 = invocation["reserve1"] as? Web3BigUInt else {
            throw UniswapV2Error.getReserveIssue(computedPair)
        }

        let (token0, _) = try sortTokens(tokenA: tokenA, tokenB: tokenB)

        return tokenA == token0 ? (reserve0.euler, reserve1.euler) : (reserve1.euler, reserve0.euler);
    }

    func getAmountOut(
        amountIn: Euler.BigInt,
        reserveIn: Euler.BigInt,
        reserveOut: Euler.BigInt
    ) throws -> Euler.BigInt {
        guard amountIn != 0 else { return .zero } // Zero in, zero out!
        guard amountIn > 0 else {
            throw UniswapV2Error.insufficientInputAmount
        }
        guard reserveIn > 0 && reserveOut > 0 else { throw UniswapV2Error.insufficientLiquidity }
        let amountInWithFee = amountIn * (1_000 - fee)
        let numerator = amountInWithFee * reserveOut
        let denominator = reserveIn * BigInt(1_000) + amountInWithFee
        return numerator / denominator
    }

    func getAmountOut(amountIn: Euler.BigInt, tokenA: Token, tokenB: Token, meta: RequiredPriceInfo) throws -> Euler.BigInt {
        let reserveIn = tokenA > tokenB ? meta.reserveA : meta.reserveB
        let reserveOut = tokenA > tokenB ? meta.reserveB : meta.reserveA
        return try self.getAmountOut(amountIn: amountIn, reserveIn: reserveIn, reserveOut: reserveOut)
    }

    func getAmountIn(
        amountOut: Euler.BigInt,
        reserveIn: Euler.BigInt,
        reserveOut: Euler.BigInt
    ) throws -> Euler.BigInt {
        guard amountOut > 0 else { throw UniswapV2Error.insufficientInputAmount }
        guard reserveIn > 0 && reserveOut > 0 else { throw UniswapV2Error.insufficientLiquidity }
        let numerator = reserveIn * amountOut * BigInt(1_000)
        let denominator = (reserveOut - amountOut) * (1_000 - fee)
        return (numerator / denominator) + 1
    }

    // MARK: - Methods

    func getQuote(maxAvailableAmount: Euler.BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: RequiredPriceInfo?) async throws -> (Quote, RequiredPriceInfo) {
        let tokenA = normalizeToken(token: tokenA)
        let tokenB = normalizeToken(token: tokenB)

        var reserveA: Euler.BigInt;
        var reserveB: Euler.BigInt;
        if let meta = meta {
            reserveA = meta.reserveA
            reserveB = meta.reserveB
        } else {
            (reserveA, reserveB) = try await getReserves(factory: self.factory, tokenA: tokenA.address, tokenB: tokenB.address)
        }

        let meta = RequiredPriceInfo(
            routerAddress: self.delegate.address!,
            factoryAddress: self.factory,
            reserveA: reserveA,
            reserveB: reserveB
        )

        guard let maxAvailableAmount = maxAvailableAmount else {
            var biRN = Euler.BigInt(sign: false, words: reserveA.words.map { $0 })
            var biRD = Euler.BigInt(sign: false, words: reserveB.words.map { $0 })

            // Adjust decimals, using Token.decimals defaults to 18
            let tokenADecimals = tokenA.decimals
            let tokenBDecimals = tokenB.decimals

            // adjust decimal difference
            let decimalDifference = tokenADecimals - tokenBDecimals

            // if tokenA has more decimals
            if decimalDifference > 0 {
                biRD = biRD * Euler.BigInt(10) ** (decimalDifference)
            } else if decimalDifference < 0 { // if tokenB has more decimals
                biRN = biRN * Euler.BigInt(10) ** (-decimalDifference)
            } // if no difference, no adjustment necessary

            let price = BigDouble(biRD, over: biRN)

            let quote = Quote(
                exchangeName: self.name,
                amount: .zero,
                amountOut: .zero,
                price: price,
                transactionPrice: price,
                tokenA: tokenA,
                tokenB: tokenB,
                ttf: nil
            )
            return (quote, meta)
        }

        let _quoteOut = maximizeB
        ? try self.getAmountOut(amountIn: maxAvailableAmount, reserveIn: reserveA, reserveOut: reserveB)
        : try self.getAmountIn(amountOut: maxAvailableAmount, reserveIn: reserveB, reserveOut: reserveA)

        let biTN = Euler.BigInt(sign: false, words: _quoteOut.words.map { $0 })
        let biTD = Euler.BigInt(sign: false, words: maxAvailableAmount.words.map { $0 })

        let transactionPrice = BigDouble(biTN, over: biTD)

        let biRN = Euler.BigInt(sign: false, words: reserveA.words.map { $0 })
        let biRD = Euler.BigInt(sign: false, words: reserveB.words.map { $0 })

        let price = BigDouble(biRD, over: biRN)

        let quote = Quote(
            exchangeName: self.name,
            amount: maxAvailableAmount,
            amountOut: _quoteOut,
            price: price,
            transactionPrice: transactionPrice,
            tokenA: tokenA,
            tokenB: tokenB,
            ttf: nil
        )

        return (quote, meta)
    }

    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int {
        fatalError("Method not implemented")
    }

    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost {
        fatalError("Method not implemented")
    }

    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Method not implemented")
    }

    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Method not implemented")
    }

    func balanceFor(token: Token) async throws -> Double {
        fatalError("Method not implemented")
    }

    func computeInputForMaximizingTrade(truePriceTokenA: Euler.BigInt, truePriceTokenB: Euler.BigInt, meta: RequiredPriceInfo) -> Euler.BigInt {
        let reserveA = meta.reserveA
        let reserveB = meta.reserveB

        let aToB = reserveA * truePriceTokenB / reserveB < truePriceTokenA

        let invariant = reserveA * reserveB

        let leftSide = (
            invariant
            * 1000
            * (aToB ? truePriceTokenA : truePriceTokenB)
            / ((aToB ? truePriceTokenB : truePriceTokenA) * fee)
        ).squareRoot()?.rounded() ?? .zero
        let rightSide = (aToB ? reserveA * 1000 : reserveB * 1000) / fee

        if leftSide < rightSide {
            return .zero
        }

        let amountIn = leftSide - rightSide

//        let amountOutA = aToB
//        ? reserveB - (invariant / (reserveA + amountIn))
//        : reserveA - (invariant / (reserveB + amountIn))
//
//        let amountOutB = aToB
//        ? reserveA - (invariant / (reserveB + amountOutA))
//        : reserveB - (invariant / (reserveA + amountOutA))

        return amountIn
    }
}

extension UniswapV2 {
    static func == (lhs: UniswapV2, rhs: UniswapV2) -> Bool {
        return lhs.name == rhs.name
    }
}
