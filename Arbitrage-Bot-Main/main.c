//
//  main.c
//  Arbitrage-Bot-Main
//
//  Created by Arthur Guiot on 03/07/2023.
//

#if XCODEBUILD
#include <Arbitrage_Bot_Demo/Arbitrage_Bot_Demo.h>
#else
#import "Arbitrage_Bot_Demo.h"
#endif

int main(int argc, const char * argv[]) {
    arbitrage_main(argc, argv);
}
