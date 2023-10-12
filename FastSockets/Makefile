CC = g++
AR = ar
CFLAGS = -std=gnu++20 -Wall -I. -I.. -I./uWebSockets/src

# .cpp files
CPP_SOURCES = libuwebsockets.cpp

# .h files
H_SOURCES = FastSockets.h libusockets.h libuwebsockets.h

# Object files
OBJ = $(CPP_SOURCES:.cpp=.o)

# Libraries
LIBS = ./uWebSockets/uSockets/uSockets.a

# Link
LINK = libuSockets.a

# Output
TARGET = libFastSockets.a

all: $(CPP_SOURCES) $(TARGET)

$(TARGET): $(LIBS) $(OBJ)
	$(AR) rvs $(TARGET) $(OBJ)

$(LIBS):
	cd ./uWebSockets/uSockets && make clean && make
	ln -s $(LIBS) $(LINK)

%.o: %.cpp $(H_SOURCES)
	$(CC) -c -o $@ $< $(CFLAGS)

.PHONY: clean

clean:
	rm -f *.o $(TARGET) $(LINK)
	cd ./uWebSockets/uSockets && make clean
