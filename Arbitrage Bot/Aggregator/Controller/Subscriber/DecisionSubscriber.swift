//
//  DecisionSubscriber.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation
import OpenCombine

class DecisionDataSubscriber: Subscriber {
    typealias Input = BotResponse
    typealias Failure = Never
    
    let receiveValue: (BotResponse) -> Void
    
    init(_ receiveValue: @escaping (BotResponse) -> Void) {
        self.receiveValue = receiveValue
    }
    
    func receive(subscription: Subscription) {
        subscription.request(.unlimited)
    }
    
    func receive(_ input: BotResponse) -> Subscribers.Demand {
        receiveValue(input)
        return .unlimited
    }
    
    func receive(completion: Subscribers.Completion<Never>) {
        // You can handle the completion event here
    }
}
