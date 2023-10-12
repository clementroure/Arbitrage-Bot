# ``Arbitrage_Bot``

@Metadata {
    @DisplayName("Arbitrage Bot")
}

This is a high-level, efficient, and streamlined library designed to facilitate development of cryptocurrency bots. The primary goal of this framework is to automate and simplify typical tasks like monitoring market prices, identifying profitable arbitrage opportunities and executing trades accordingly.

## Features

1. **Server Management:** Includes tools to swiftly manage the WebSocket server. You can set up a server and start it with the desired port using simple function calls.

2. **Price Data Storage:** This feature allows for efficient management and access of price data. The provided Price Data Store retains up-to-date price information for various tokens, making it easier to examine and utilize this information while formulating trading strategies.

3. **Automated Trading Mecanism:** Easily perform trades by letting the system know what possible arbitrage routes you found. The system will take care of optimizing the input amount for each route, and will choose the best option.

4. **Opportunity Tracking:** An intelligent queue system handles potential arbitrage opportunities. The system can identify and store these prospects as they appear, moreover there are also facilities to process these opportunities when suitable.

## How to Use

1. Initialize your server and data store using `new_server()` and `create_store()` accordingly.
2. Set up your server with the required port using `start_server()`.
3. Use the `pipe()` function to link your server with your data store, ensuring robust data flow.
4. `get_name_for_token()` can be utilized to resolve a token name from given token address.
5. Utilize the `add_opportunity_in_queue()` function to queue any identified arbitrage opportunity, and `process_opportunities()` function to examine and action on these queued opportunities.

Here's a simple script demonstrating the library:
```c
#include <Arbitrage_Bot/Arbitrage_Bot.h> // If this doesn't work, try #include "arbitrager.h"

#define MAX_EDGES 100
// MARK: - Main
int arbitrage_main(int argc, const char * argv[]) {
    // Start the server
    Server *server = new_server();

    PriceDataStore *store = create_store();

    store->on_tick = on_tick;

    server->pipe(store);

    start_server(server, 8080);

    return 0;
}

void on_tick(const double* rates, const CToken* tokens, size_t size, size_t systemTime) { ... }
```

### Example
As we aim to provide a simple and easy-to-use library, we have also included a sample bot that demonstrates the use of this library. This bot is designed to identify cycle arbitrage opportunities within the Ethereum network. It relies on the Uniswap V2 decentralized exchange to perform trades. The bot is designed to be run with a web-app for monitoring. Here's how you can run the bot:

1. Clone the repository, including the submodules.
2. Navigate to the `Arbitrage-Bot` directory.
3. Run `yarn install` to install the required dependencies.
4. Run `make` to build the bot. This will give you a path to the executable.
5. Run `yarn dev` to start the UI.
6. Run `.build/<ARCH>/release/Arbitrage_Bot-Main` to start the bot in a separate terminal window.

> Another way is to build the bot using Xcode. Open the `Arbitrage-Bot.xcodeproj` file in Xcode and build the project with target `Arbitrage-Bot-Main`. This will build and run the bot in a single step. You will still need to run `yarn dev` to start the UI!

> One thing that you may want to add, is the `.env` file. Here's an example of what it should look like:
> ```
> USE_TESTNET=TRUE
> JSON_RPC_URL=wss://...
> HTTP_JSON_RPC_URL=https://...
> WETH_CONTRACT_ADDRESS=0xd1f55F0C1b1ae589b9bad543bab96e841AF2b2d1
> WALLET_PRIVATE_KEY="..."
> ```


## Topics

### Web3
- ``ABI``
- ``ABIConvertible``
- ``ABIDecodable``
- ``ABIDecoder``
- ``ABIEncodable``
- ``ABIEncoder``
- ``ABIObject``
- ``AnnotatedERC20``
- ``AnnotatedERC721``
- ``BasicRPCRequest``
- ``BasicRPCResponse``
- ``DynamicContract``
- ``ERC165Contract``
- ``ERC20Contract``
- ``ERC721Contract``
- ``EnumeratedERC721``
- ``EthereumAddress``
- ``EthereumBlockObject``
- ``EthereumCall``
- ``EthereumCallParams``
- ``EthereumContract``
- ``EthereumData``
- ``EthereumLogObject``
- ``EthereumPrivateKey``
- ``EthereumPublicKey``
- ``EthereumQuantity``
- ``EthereumQuantityTag``
- ``EthereumSignedTransaction``
- ``EthereumSyncStatusObject``
- ``EthereumTransaction``
- ``EthereumTransactionobject``
- ``EthereumTransactionReceiptObject``
- ``EthereumUtils``
- ``EthereumValue``
- ``EthereumValueConvertible``
- ``EthereumValueInitializable``
- ``EthereumValueInitializableError``
- ``EthereumValueRepresentable``
- ``EthereumValueRepresentableError``
- ``GenericERC20Contract``
- ``GenericERC721Contract``
- ``InvocationError``
- ``RLPDecoder``
- ``RLPEncoder``
- ``RLPItem``
- ``RLPItemConvertible``
- ``RLPItemInitializable``
- ``RLPItemInitializableError``
- ``RLPItemRepresentable``
- ``RLPItemRepresentableError``
- ``RPCEventResponse``
- ``RPCRequest``
- ``RPCResponse``
- ``SolidityConstantFunction``
- ``SolidityConstructor``
- ``SolidityConstructorInvocation``
- ``SolidityEmittedEvent``
- ``SolidityEvent``
- ``SolidityFunction``
- ``SolidityFunctionHandler``
- ``SolidityFunctionParameter``
- ``SolidityInvocation``
- ``SolidityNonPayableFunction``
- ``SolidityNonPayableInvocation``
- ``SolidityParameter``
- ``SolidityPayableFunction``
- ``SolidityPayableInvocation``
- ``SolidityReadInvocation``
- ``SolidityTuple``
- ``SolidityType``
- ``SolidityTypeRepresentable``
- ``SolidityWrappedValue``
- ``StaticContract``
- ``StringHexBytesError``
- ``Web3``
- ``WebBidirectionalProvider``
- ``Web3HttpProvider``
- ``Web3Provider``
- ``Web3Response``
- ``Web3WebSocketProvider``
