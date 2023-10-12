//
//  Test.m
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

#import "include/arbitrager.h"
#if XCODEBUILD
#import <Arbitrage_Bot/Arbitrage_Bot-Swift.h>
#import <FastSockets/FastSockets.h>
#else
#import <string.h>
#import <FastSocketsPM.h>
#import "Aggregator-Swift.h"
//@import Aggregator;


#endif

#include <stdio.h>

#define SSL 0

pthread_mutex_t lock;

// MARK: - Server

typedef struct
{
    char *value;
    size_t length;
} header_t;
struct PerSocketData
{
    int controller;
    Server *server;
};

struct PerSocketData *socket_data_base;

struct UpgradeData
{
    header_t *secWebSocketKey;
    header_t *secWebSocketProtocol;
    header_t *secWebSocketExtensions;
    uws_socket_context_t *context;
    uws_res_t *response;
    bool aborted;
};

header_t *create_header(size_t length, const char* value)
{
    header_t *header = (header_t *)malloc(sizeof(header_t));
    if(length > 0){
        header->value = (char *)calloc(sizeof(char), length);
        header->length = length;
        memcpy(header->value, value, length);
    }else{
        header->value = NULL;
        header->length = 0;
    }
    return header;
}
void free_header(header_t *header)
{
    
    free(header->value);
    free(header);
}
void listen_handler(struct us_listen_socket_t *listen_socket, uws_app_listen_config_t config, void *user_data)
{
    if (listen_socket)
    {
        printf("Listening on port wss://localhost:%d\n", config.port);
    }
}
//Timer close helper
void perform_upgrade(void *data)
{
    
    struct UpgradeData *upgrade_data = (struct UpgradeData *)data;
    
    /* Were'nt we aborted before our async task finished? Okay, upgrade then! */
    if (!upgrade_data->aborted)
    {
        struct PerSocketData *socket_data = (struct PerSocketData *)malloc(sizeof(struct PerSocketData));
        memcpy((void*)socket_data, (void*)socket_data_base, sizeof(struct PerSocketData));

        uws_res_upgrade(SSL,
                        upgrade_data->response,
                        socket_data,
                        upgrade_data->secWebSocketKey->value,
                        upgrade_data->secWebSocketKey->length,
                        upgrade_data->secWebSocketProtocol->value,
                        upgrade_data->secWebSocketProtocol->length,
                        upgrade_data->secWebSocketExtensions->value,
                        upgrade_data->secWebSocketExtensions->length,
                        upgrade_data->context);
    }
    else
    {
        printf("Async task done, but the HTTP socket was closed. Skipping upgrade to WebSocket!\n");
    }
    free_header(upgrade_data->secWebSocketKey);
    free_header(upgrade_data->secWebSocketProtocol);
    free_header(upgrade_data->secWebSocketExtensions);
    free(upgrade_data);
}

void on_res_aborted(uws_res_t *response, void *data)
{
    struct UpgradeData *upgrade_data = (struct UpgradeData *)data;
    /* We don't implement any kind of cancellation here,
     * so simply flag us as aborted */
    upgrade_data->aborted = true;
}
void upgrade_handler(uws_res_t *response, uws_req_t *request, uws_socket_context_t *context)
{
    
    /* HttpRequest (req) is only valid in this very callback, so we must COPY the headers
     * we need later on while upgrading to WebSocket. You must not access req after first return.
     * Here we create a heap allocated struct holding everything we will need later on. */
    
    struct UpgradeData *data = (struct UpgradeData *)malloc(sizeof(struct UpgradeData));
    data->aborted = false;
    data->context = context;
    data->response = response;
    
    const char *ws_key = NULL;
    const char *ws_protocol = NULL;
    const char *ws_extensions = NULL;
    
    size_t ws_key_length = uws_req_get_header(request, "sec-websocket-key", 17, &ws_key);
    size_t ws_protocol_length = uws_req_get_header(request, "sec-websocket-protocol", 22, &ws_protocol);
    size_t ws_extensions_length = uws_req_get_header(request, "sec-websocket-extensions", 24, &ws_extensions);
    
    
    data->secWebSocketKey = create_header(ws_key_length, ws_key);
    data->secWebSocketProtocol = create_header(ws_protocol_length, ws_protocol);
    data->secWebSocketExtensions = create_header(ws_extensions_length, ws_extensions);
    
    /* We have to attach an abort handler for us to be aware
     * of disconnections while we perform async tasks */
    
    uws_res_on_aborted(SSL, response, on_res_aborted, data);
    
    perform_upgrade(data);
}

void realtime_msg_forward(const char * _Nonnull message, uint16_t length, uws_websocket_t *ws) {
    pthread_mutex_lock(&lock);  // acquire the lock
    
    struct PerSocketData *data = (struct PerSocketData *)uws_ws_get_user_data(SSL, ws);
    
    if (data) {
        uws_ws_send(SSL, ws, message, length, TEXT);
    }
    pthread_mutex_unlock(&lock);  // release the lock
}

void open_handler(uws_websocket_t *ws)
{
    
    /* Open event here, you may access uws_ws_get_user_data(ws) which points to a PerSocketData struct.
     * Here we simply validate that indeed, something == 15 as set in upgrade handler. */
    
    struct PerSocketData *data = (struct PerSocketData *)uws_ws_get_user_data(SSL, ws);
    
    // Create an instance of RealtimeServerController
    int controller = _create_realtime_server_controller(data->server->dataStore->_wrapper, realtime_msg_forward, ws);

    data->controller = controller;
}

void message_handler(uws_websocket_t *ws, const char *message, size_t length, uws_opcode_t opcode)
{
    struct PerSocketData *data = (struct PerSocketData *)uws_ws_get_user_data(SSL, ws);
    int controller = data->controller;

    _realtime_server_handle_request(controller, message, length);
}

void close_handler(uws_websocket_t *ws, int code, const char *message, size_t length)
{
    
    /* You may access uws_ws_get_user_data(ws) here, but sending or
     * doing any kind of I/O with the socket is not valid. */
    struct PerSocketData *data = (struct PerSocketData *)uws_ws_get_user_data(SSL, ws);
    if (data)
    {
        _close_realtime_server_controller(data->controller);
        free(data);
    }
}

void drain_handler(uws_websocket_t *ws)
{
    /* Check uws_ws_get_buffered_amount(ws) here */
}

void ping_handler(uws_websocket_t *ws, const char *message, size_t length)
{
    /* You don't need to handle this one, we automatically respond to pings as per standard */
}

void pong_handler(uws_websocket_t *ws, const char *message, size_t length)
{
    
    /* You don't need to handle this one either */
}

// MARK: - Public

PriceDataStore *create_store(void) {
    PriceDataStore *store = (PriceDataStore *)malloc(sizeof(PriceDataStore));
    
    int sharedWrapper = _create_store();
    
    store->_wrapper = sharedWrapper;
    return store;
}
// Define the pipe function implementation
void pipe_function(PriceDataStore *dataStore) {
    socket_data_base->server->dataStore = dataStore;
    // Bind the on_tick callback to the data store
    _attach_tick_price_data_store(dataStore->_wrapper, ^(const double * _Nonnull array, const uint8_t * _Nonnull tokens, uint32_t size, uint32_t systemTime) {
        CToken *cTokens = malloc(sizeof(CToken) * size);
        
        // Assign each cToken. Remember, each address is 20 long.
        for (uint32_t i = 0; i < size; i++) {
            CToken temp = {
                ._index = i,
                .address = tokens + i*20
            };
            memcpy(cTokens + i, &temp, sizeof(CToken));
        }
        
        dataStore->on_tick(dataStore, array, cTokens, size, systemTime);
        
        // Free the dynamically allocated memory
        free(cTokens);
    });
}

Server *new_server(void) {
    _loadEnvironmentFromFile(".env");

    uws_app_t *app = uws_create_app(SSL, (struct us_socket_context_options_t){
    });
    
    // Create and initialize the Server struct
    Server *server = (Server *)malloc(sizeof(Server));
    server->pipe = pipe_function;
    server->app = app;
    
    socket_data_base = (struct PerSocketData *)malloc(sizeof(struct PerSocketData));
    socket_data_base->server = server;
    
    uws_ws(SSL, app, "/*", (uws_socket_behavior_t){
        .compression = SHARED_COMPRESSOR,
        .maxPayloadLength = 16 * 1024,
        .idleTimeout = 10 * 60, // 10 minutes
        .maxBackpressure = 1 * 1024 * 1024,
        .upgrade = upgrade_handler,
        .open = open_handler,
        .message = message_handler,
        .drain = drain_handler,
        .ping = ping_handler,
        .pong = pong_handler,
        .close = close_handler,
    }, NULL);
    
    return server;
}

void start_server(Server *server, int port) {
    uws_app_t *app = server->app;
    
    uws_app_listen(SSL, app, port, listen_handler, NULL);
    
    uws_app_run(SSL, app);
}


void get_name_for_token(const uint8_t * _Nonnull tokenAddress, char * _Nonnull result) {
    _name_for_token(tokenAddress, result);
}

void add_opportunity_in_queue(void * _Nonnull dataStore, int * _Nonnull order, size_t size, size_t systemTime) {
    PriceDataStore *store = (PriceDataStore *)dataStore;
    _add_opportunity_for_review(store->_wrapper, order, size, systemTime);
}

void process_opportunities(void * _Nonnull dataStore, size_t systemTime) {
    PriceDataStore *store = (PriceDataStore *)dataStore;
    _review_and_process_opportunities(store->_wrapper, systemTime);
}
