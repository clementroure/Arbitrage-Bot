//
//  VisualGraph.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 04/07/2023.
//

import Foundation

#if DEBUG
#if canImport(SwiftPlot)
#if canImport(SVGRenderer)
import Euler
@testable import SwiftPlot
import SVGRenderer
import AppKit


extension BuilderStep {
    fileprivate func price(_ x: Double) -> Double {
        let p = try! self.price(for: BN(x).cash).0
        return BN(cash: p).asDouble() ?? 0
    }
    
    fileprivate func dev1(_ x: Double) -> Double {
        let a = price(x)
        let b = price(x + 1)
        let d = (b - a) / 1.0
        return d
    }
    
    fileprivate func dev2(_ x: Double) -> Double {
        let u = (dev1(x + 0.1) - dev1(x)) / 0.1
        return u
    }
    
    func drawGraph(maxX: Double = 200) {
        print(self.printPath)
        let renderer = SVGRenderer()
        var lineGraph = LineGraph<Double, Double>(enablePrimaryAxisGrid: true)
        lineGraph.addFunction(dev1, minX: 0.1, maxX: maxX, numberOfSamples: 1000, label: "Dev1", color: .orange, axisType: .secondaryAxis)
//        lineGraph.addFunction(dev2, minX: 10.0, maxX: 200.0, numberOfSamples: 1000, label: "Dev2", color: .red, axisType: .secondaryAxis)
        lineGraph.addFunction(price, minX: 0.1, maxX: maxX, numberOfSamples: 1000, label: "Price", color: .blue)
        lineGraph.plotTitle.title = "FUNCTION"
        lineGraph.plotLabel.xLabel = "X-AXIS"
        lineGraph.plotLabel.yLabel = "Y-AXIS"
        lineGraph.drawGraph(renderer: renderer)
        let image = renderer.svg
        // Save using FileManager
        let fileManager = FileManager.default
        let homeDirectory = fileManager.homeDirectoryForCurrentUser
        let url = homeDirectory.appendingPathComponent("Downloads/Plot.svg")
        let data = image.data(using: .utf8)
        // Write the PNG representation to disk
        try! data?.write(to: url)
    }
}
fileprivate func copyToClipboard(string: String) {
    let pasteboard = NSPasteboard.general
    pasteboard.declareTypes([.string], owner: nil)
    pasteboard.setString(string, forType: .string)
}
#endif
#endif
#endif
