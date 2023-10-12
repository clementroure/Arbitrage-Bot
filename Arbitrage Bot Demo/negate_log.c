//
//  negate_log.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 28/06/2023.
//

#include "negate_log.h"

#include <math.h>

#ifdef ACCELERATE_AVAILABLE
void calculate_neg_log(const double* in_data, double* out_data, int count) {
    // Calculate log(x)
    vvlog(out_data, in_data, &count);
    
    // Now calculate -log(x) by multiplying by -1
    double negative_one = -1.0;
    vDSP_vsmulD(out_data, 1, &negative_one, out_data, 1, count);
}
#else
void calculate_neg_log(const double* in_data, double* out_data, int count) {
    for (int i = 0; i < count; ++i) {
        // Calculate -log(x)
        out_data[i] = -log(in_data[i]);
    }
}
#endif
