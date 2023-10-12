//
//  Front.h
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//
// This header file defines the data structures and key functions for our Arbitrage bot.

#ifndef FRONT_ARBITRAGE_H
#define FRONT_ARBITRAGE_H

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <pthread.h>

/// CToken is a structure representing a Digital Token used in arbitrage operations.
/// @field index An integer acting as an unique identifier for the token.
/// @field address Unsigned character pointer representing the token's address.
typedef struct {
    /// An integer acting as an unique identifier for the token.
    const int _index;
    /// Unsigned character pointer representing the token's address, or name. It's an array of `UInt8` representing the hex address as a number.
    ///
    /// You can use ``get_name_for_token(tokenAddress, result)`` to get the string name from this address.
    const unsigned char * _Nonnull address;
} CToken;

/// Fetches the name associated with a specific token address.
/// @param tokenAddress (_Nonnull uint8_t*) The token address used to lookup the token name.
/// @param result (_Nonnull char*) The pointer where the result string (token name) will be written.
void get_name_for_token(const uint8_t * _Nonnull tokenAddress, char * _Nonnull result);

/// PriceDataStore is a structure representing a system containing different token rates.
/// @field wrapper Generic pointer representing the system wrapper.
/// @field on_tick Function pointer to be executed on each tick.
/// The function must include the rates, tokens, size of tokens and system time as parameters.
/// @seealso CToken
typedef struct {
    /// Price Data Store Wrapper reference in Swift.
    ///
    /// This is an internal property, you don't need to touch this.
    int _wrapper;
    /// Everytime prices changes, this function is called.
    ///
    /// @param dataStore Pointer to the associated price data store.
    /// @param rates (_Nonnull const double*) Pointer to the array of current rates. This is a single array, of size `size * size`. You can see this as a matrix, containing all the bidirectional prices for the pairs. For example:
    /// |       | USDT  | ETH                 | TKA              | TKB              |
    /// |-------|-------|---------------------|------------------|------------------|
    /// | USDT  | 1.0   | 0.0005563177237620392 | inf | 1.8897988335995675 |
    /// | ETH   | 1825.9812561052 | 1.0               | 446.3807633676      | inf   |
    /// | TKA   | inf   | 0.0025              | 1.0              | 2.0596399804    |
    /// | TKB   | 0.6375577545 | inf               | 2.3109486084916444 | 1.0  |
    /// > Would be represented as:
    /// > ```swift
    /// > [1.0, 0.0005563177237620392, inf, 1.8897988335995675, 1825.9812561052, 1.0, 446.3807633676, inf, inf, 0.0025, 1.0, 2.0596399804, 0.6375577545, inf, 2.3109486084916444, 1.0]
    /// > ```
    /// @param tokens (_Nonnull const CToken*) Array of tokens for which rates are provided.
    /// > So the case above, we would have:
    /// > ```swift
    /// > ["USDT", "ETH", "TKA", "TKB"]
    /// > ```
    /// @param size (size_t) Number of tokens in the array.
    /// > In this case, 4
    /// @param systemTime (size_t) Current system time.
    ///
    /// This is where you want to define your strategy.
    ///
    /// You will want to call ``add_opportunity_in_queue(order, size, systemTime)`` for each detected opportunity and ``process_opportunities(systemTime)`` at the end.
    void (* _Nonnull on_tick)(void * _Nonnull dataStore,
                              const double* _Nonnull rates,
                              const CToken* _Nonnull tokens,
                              size_t size,
                              size_t systemTime);
} PriceDataStore;

/// Enqueue a detected arbitrage opportunity order for further processing.
/// @param dataStore Pointer to price data store.
/// @param order (_Nonnull int*) Order to be added in the queue.
/// @param size (size_t) Size of the order.
/// @param systemTime (size_t) System time when the opportunity was detected.
void add_opportunity_in_queue(void * _Nonnull dataStore, int * _Nonnull order, size_t size, size_t systemTime);

/// Process the current opportunities in the queue.
/// @param dataStore Pointer to price data store.
/// @param systemTime (size_t) System time when this function is executed.
void process_opportunities(void * _Nonnull dataStore, size_t systemTime);

/// Server is a structure representing the arbitrage bot server.
/// @field dataStore (_Nonnull PriceDataStore*) Instance of the PriceDataStore.
/// @field app (_Nonnull void*) Generic pointer representing application-specific data.
/// @field pipe (_Nonnull function) A function pointer executed to pipe the PriceDataStore.
/// @seealso PriceDataStore
typedef struct {
    /// The data structure for representing a system containing different token rates.
    PriceDataStore * _Nonnull dataStore;
    /// The uWebSockets app reference
    void * _Nonnull app;
    /// Connecting the data store to the server.
    void (* _Nonnull pipe)(PriceDataStore * _Nonnull dataStore);
} Server;

/// Creates the web socket server.
/// @discussion Allocates memory and sets up basic server parameters.
/// @return (_Nonnull Server*) Pointer to the created server.
Server * _Nonnull new_server(void);

/// Creates a new PriceDataStore.
/// @discussion Allocates memory and sets up basic parameters for the PriceDataStore.
/// @return (_Nonnull PriceDataStore*) Pointer to the created PriceDataStore.
PriceDataStore * _Nonnull create_store(void);

/// Starts the server on a specific port.
/// @param server (_Nonnull Server*) The server to be started.
/// @param port (int) The port number on which the server should listen.
void start_server(Server * _Nonnull server, int port);

#endif // FRONT_ARBITRAGE_H
