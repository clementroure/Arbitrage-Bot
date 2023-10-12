//
//  Aggregator-Swift.h
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 20/07/2023.
//

#ifndef Aggregator_Swift_h
#define Aggregator_Swift_h

void _add_opportunity_for_review(int32_t storeId, int32_t const * _Nonnull order, int size, int systemTime);


void _attach_tick_price_data_store(int storeId, void (^ _Nonnull callback)(double const * _Nonnull, uint8_t const * _Nonnull, uint32_t, uint32_t));


void _close_realtime_server_controller(int id);


int _create_realtime_server_controller(int storeId, void (* _Nonnull callback)(char const * _Nonnull, uint16_t, void const * _Nonnull), void const * _Nonnull userData);


int _create_store(void);


void _realtime_server_handle_request(int controllerId, char const * _Nonnull request, int size);


void _loadEnvironmentFromFile(char const * _Nonnull cName);


void _name_for_token(uint8_t const * _Nonnull tokenAddress, char * _Nonnull * _Nonnull result);


void _review_and_process_opportunities(int storeId, int systemTime);

#endif /* Aggregator_Swift_h */
