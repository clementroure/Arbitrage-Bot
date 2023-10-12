//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#if XCODEBUILD
#include "Arbitrage_Bot_Demo.h"
#else
#include "include/Arbitrage_Bot_Main.h"
#endif

#include "negate_log.h"
#include <math.h>
#include <stdio.h>

#ifndef DBL_MAX
#define DBL_MAX 1.7976931348623158e+308
#endif

#define MAX_EDGES 10

// MARK: - Utils
bool isValueNotInArray(int value, int *print_cycle, int size);
void reverseArray(int *a, int n);
void processArbitrage(void *dataStore, const CToken *tokens, int *arbitrageOrder, int size,
                      size_t systemTime);
void BellmanFord(const double *matrix, size_t size, int src, int *cycle,
                 int *cycle_length);

// MARK: - Main
int arbitrage_main(int argc, const char *argv[]) {
  // Start the server
  Server *server = new_server();

  PriceDataStore *store = create_store();

  store->on_tick = on_tick;

  server->pipe(store);

  start_server(server, 8080);

  return 0;
}

#if XCODEBUILD
#else
int main(int argc, const char *argv[]) { arbitrage_main(argc, argv); }
#endif

void on_tick(void *dataStore, const double *rates, const CToken *tokens, size_t size,
             size_t systemTime) {
    size_t rateSize = size * size;
    
    // Let's get the weights
    double weights[rateSize];
    
    calculate_neg_log(rates, weights, (int)rateSize);
    int src = 0; // Source vertex as 0
    int cycle[size + 2]; // Adjust the size to accommodate the two extra elements.
    int cycle_length;
    BellmanFord(weights, size, src, cycle + 1, &cycle_length); // Start from the second index
    
    // Insert src at the beginning and the end of the cycle.
    cycle[0] = src;
    cycle[cycle_length + 1] = src;
    cycle_length += 2;
    
    printf("Cycle: ");
    for (int i = 0; i < cycle_length; ++i) {
        printf("%d ", cycle[i]);
    }
    printf("\n");
    
    processArbitrage(dataStore, tokens, cycle, cycle_length, systemTime);
    
    process_opportunities(dataStore, systemTime);
}


// MARK: - Bellman Ford
void convert_matrix_to_edgelist(const double *matrix, size_t size,
                                double (*edge_list)[3]) {
  int k = 0;
  for (int i = 0; i < size; ++i) {
    for (int j = 0; j < size; ++j) {
      edge_list[k][0] = i;
      edge_list[k][1] = j;
      double w = matrix[i * size + j];
      edge_list[k][2] = isinf(w) ? INFINITY : w;
      k++;
    }
  }
}

void BellmanFord(const double *matrix, size_t size, int src, int *cycle,
                 int *cycle_length) {
  double dis[size];
  int pred[size];

  // Step 1: Initialize distances
  for (int i = 0; i < size; ++i) {
    dis[i] = DBL_MAX;
    pred[i] = -1;
  }
  dis[src] = 0;

  // Convert matrix to edge list
  double graph[size * size][3];
  convert_matrix_to_edgelist(matrix, size, graph);

  // Step 2: Relax edges |V|-1 times
  for (int k = 0; k < size - 1; ++k) {
    for (int i = 0; i < size * size; ++i) {
      int u = (int)graph[i][0];
      int v = (int)graph[i][1];
      double w = graph[i][2];
      if (dis[u] != DBL_MAX && dis[u] + w < dis[v]) {
        dis[v] = dis[u] + w;
        pred[v] = u;
      }
    }
  }

  // Step 3: Check for negative weight cycle
  *cycle_length = 0;
  for (int i = 0; i < size * size; ++i) {
    int u = (int)graph[i][0];
    int v = (int)graph[i][1];
    double w = graph[i][2];
    if (dis[u] != DBL_MAX && dis[u] + w < dis[v]) {
      printf("Graph contains negative weight cycle\n");
      for (int j = 0; j < size; ++j) {
        v = pred[v];
      }

      int cycle_node = v;
      while (true) {
        cycle[(*cycle_length)++] = v;
        if (v == cycle_node && *cycle_length > 1) {
          break;
        }
        v = pred[v];
      }
      break;
    }
  }
}
// MARK: - Utils

bool isValueNotInArray(int value, int *print_cycle, int size) {
  for (int i = 0; i < size; i++) {
    if (print_cycle[i] == value)
      return false;
  }
  return true;
}
void reverseArray(int *a, int n) {
  int c, t;
  for (c = 0; c < n / 2; c++) {
    t = a[c];
    a[c] = a[n - c - 1];
    a[n - c - 1] = t;
  }
}

void processArbitrage(void *dataStore, const CToken *tokens, int *arbitrageOrder, int size,
                      size_t systemTime) {
  int i;
  reverseArray(arbitrageOrder, size);

  add_opportunity_in_queue(dataStore, arbitrageOrder, size, systemTime);

  printf("Arbitrage Opportunity detected: \n\n");
  for (i = 0; i < size; i++) {
    char *name = NULL;
    get_name_for_token(tokens[arbitrageOrder[i]].address, &name);

    printf("%s", name);

    free(name);

    if (size > i + 1)
      printf(" -> "); // Print arrow only n-1 times
  }
  printf("\n");
  printf("_______________________________\n\n\n");
}
