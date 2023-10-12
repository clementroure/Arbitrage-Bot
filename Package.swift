// swift-tools-version:5.8
import PackageDescription

let package = Package(
    name: "ArbitrageBot",
    platforms: [
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "Arbitrage_Bot",
            targets: ["Arbitrage_Bot"]),
        .executable(
            name: "Arbitrage_Bot-Main",
            targets: ["Arbitrage_Bot_Demo"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/OpenCombine/OpenCombine.git", from: "0.14.0"),
        .package(url: "https://github.com/arguiot/Euler.git", .upToNextMajor(from: "0.3.11")),
        .package(url: "https://github.com/JohnSundell/CollectionConcurrencyKit.git", from: "0.2.0"),
        .package(url: "https://github.com/attaswift/BigInt.git", from: "5.1.0"),
        .package(url: "https://github.com/apple/swift-collections.git", from: "1.0.4"),
        .package(url: "https://github.com/Boilertalk/secp256k1.swift.git", from: "0.1.7"),
        .package(url: "https://github.com/krzyzanowskim/CryptoSwift.git", from: "1.7.1"),
        .package(url: "https://github.com/apple/swift-docc-plugin", from: "1.0.0"),
        .package(url: "https://github.com/vapor/websocket-kit", .upToNextMajor(from: "2.6.1")),
    ],
    targets: [
        .systemLibrary(
            name: "FastSockets",
            path: "FastSockets"
        ),
        .target(
            name: "Aggregator",
            dependencies: [
                .product(name: "OpenCombine", package: "OpenCombine"),
                .product(name: "OpenCombineDispatch", package: "OpenCombine"),
                .product(name: "OpenCombineFoundation", package: "OpenCombine"),
                "Euler",
                "CollectionConcurrencyKit",
                "BigInt",
                "CryptoSwift",
                .product(name: "Collections", package: "swift-collections"),
                .product(name: "secp256k1", package: "secp256k1.swift"),
                .product(name: "WebSocketKit", package: "websocket-kit"),
            ],
            path: "Arbitrage Bot/Aggregator/"
        ),
        .target(
            name: "Arbitrage_Bot",
            dependencies: [
                "Aggregator",
                "FastSockets"
            ],
            path: "Arbitrage Bot/Arbitrager/",
            cSettings: [
                .unsafeFlags(["-I", "FastSockets/"]),
//                .headerSearchPath("FastSockets/")
            ],
            linkerSettings: [
                .unsafeFlags(["-L", "FastSockets/", "-lFastSockets", "-luSockets",
                              "-lz",
                             ])
            ]
        ),
        .testTarget(
            name: "Arbitrage-BotTests",
            dependencies: ["Arbitrage_Bot"],
            path: "Arbitrage-BotTests"
        ),
        .executableTarget(
            name: "Arbitrage_Bot_Demo",
            dependencies: ["Arbitrage_Bot"],
            path: "Arbitrage Bot Demo",
            cSettings: [
                .headerSearchPath("./Arbitrage Bot"),
                .define("SWIFT_PACKAGE")
            ]
        ),
//        .executableTarget(
//            name: "Arbitrage_Bot-Main",
//            dependencies: ["Arbitrage_Bot_Demo"],
//            path: "Arbitrage-Bot-Main",
//            cSettings: [
//                .headerSearchPath("./Arbitrage Bot Demo"),
//                .define("SWIFT_PACKAGE")
//            ]
//        )
    ],
    cLanguageStandard: .gnu99
)
