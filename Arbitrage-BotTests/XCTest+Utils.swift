//
//  XCTest+Utils.swift
//  Arbitrage-BotTests
//
//  Created by Arthur Guiot on 29/06/2023.
//

import Foundation
import XCTest

extension XCTestCase {
    func measureAsync(callback: @escaping () async -> Void) {
        self.measure {
            let sema = DispatchSemaphore(value: 0)
            Task {
                await callback()
                sema.signal()
            }
            sema.wait()
        }
    }
}
