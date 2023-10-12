//
//  Environment.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

public class Environment {
    public static var shared = [String: String]()
    
    public static func get(_ key: String) -> String? {
        return Self.shared[key]
    }
    
    public static func load(from file: String = ".env") {
        let fileManager = FileManager.default
        let currentDirectory = fileManager.currentDirectoryPath
        let filePath = currentDirectory + "/" + file
        let fileURL = URL(fileURLWithPath: filePath)
        
        guard let contents = try? String(contentsOf: fileURL, encoding: .utf8) else {
            print("Error loading .env file")
            return
        }
        
        let lines = contents.split(separator: "\n")
        for line in lines {
            let keyValue = line.split(separator: "=", maxSplits: 1)
            if keyValue.count == 2 {
                let key = String(keyValue[0]).trimmingCharacters(in: .whitespacesAndNewlines)
                var value = String(keyValue[1]).trimmingCharacters(in: .whitespacesAndNewlines)
                
                // Remove quotes if present
                if value.hasPrefix("\"") && value.hasSuffix("\"") {
                    value = String(value.dropFirst().dropLast())
                }
                
                Self.shared[key] = value
            }
        }
    }
}
