//
//  DecisionDataPublisher.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation
import OpenCombine

class DecisionDataPublisher{
    static let shared = DecisionDataPublisher()
    let coordinator = ArbitrageSwapCoordinator()
    
    let subject = PassthroughSubject<BotResponse, Never>()
    
    func receive<S>(subscriber: S) where S: Subscriber, Never == S.Failure, BotResponse == S.Input {
        subject.subscribe(subscriber)
    }
    
    func publishDecision(decision: BotResponse) {
        subject.send(decision)
    }
}
