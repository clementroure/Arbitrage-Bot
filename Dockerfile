FROM swift:latest as builder

ARG DEBUG

WORKDIR /app

# Copy your entire project, including .env, into the container
COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    binutils \
    libssl-dev \
    openssl \
    zlib1g-dev \
    && WITH_LTO=0 make

# Get the binary path using swift build --show-bin-path
RUN if [ "$DEBUG" = "1" ]; then \
    BIN_PATH=$(swift build --show-bin-path); \
else \
    BIN_PATH=$(swift build -c release --show-bin-path); \
fi \
    && cp "${BIN_PATH}/Arbitrage_Bot-Main" /app/

CMD [ "./Arbitrage_Bot-Main" ]
