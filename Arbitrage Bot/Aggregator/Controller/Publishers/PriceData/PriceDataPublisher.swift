//
//  PriceDataPublisher.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import OpenCombine

public class PriceDataPublisher: Publisher {
    public typealias Output = (BotResponse, Int)
    public typealias Failure = Error
    
    private let subject = PassthroughSubject<Output, Failure>()
    internal var priceDataSubscription: PriceDataSubscription!
    
    init(storeId: Int) {
        priceDataSubscription = PriceDataSubscription(storeId: storeId) { [weak self] result in
            switch result {
            case .success(let response):
                self?.subject.send(response)
            case .failure(let error):
                self?.subject.send(completion: .failure(error))
            }
        }
    }
    
    public func receive<S>(subscriber: S) where S : Subscriber, Failure == S.Failure, Output == S.Input {
        subject.receive(subscriber: subscriber)
    }
}
