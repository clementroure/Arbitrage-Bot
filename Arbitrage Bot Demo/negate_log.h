//
//  negate_log.h
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 28/06/2023.
//

#ifndef _NEGATIVE_LOG_H_
#define _NEGATIVE_LOG_H_

#include <stdint.h>

// Define this macro to use the Accelerate framework.
// Comment it out to use portable C code.
#define USE_ACCELERATE

#define ACCELERATE_AVAILABLE

#ifdef USE_ACCELERATE
#if defined(__APPLE__)
#include <Accelerate/Accelerate.h>
#else
#undef ACCELERATE_AVAILABLE
#endif
#endif

void calculate_neg_log(const double* in_data, double* out_data, int count);

#endif // _NEGATIVE_LOG_H_

