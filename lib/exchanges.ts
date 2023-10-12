type Exchange = {
    name: string;
    type: "dex" | "cex";
    adapter?: string;
    routerAddress?: string;
    factoryAddress?: string;
    coordinatorAddress?: string; // Address of the coordinator contract for flash swaps
    testnet?: boolean;
    icon?: string;
};

type IExchangesList = {
    development: {
        [key: string]: Exchange;
    };
    production: {
        [key: string]: Exchange;
    };
};

export const ExchangesList: IExchangesList = {
    development: {
        uniswap: {
            name: "Uniswap V2",
            type: "dex",
            adapter: "uniswap",
            factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
            routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730",
            icon: "https://cryptologos.cc/logos/uniswap-uni-logo.png?v=025",
        },
        pancakeswap: {
            name: "PancakeSwap",
            type: "dex",
            adapter: "uniswap",
            factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
            routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730",
            icon: "https://cryptologos.cc/logos/pancakeswap-cake-logo.png?v=025",
        },
        apeswap: {
            name: "ApeSwap",
            type: "dex",
            adapter: "uniswap",
            factoryAddress: "0x5722F3b02b9fe2003b3045D73E9230684707B257",
            routerAddress: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730",
            icon: "https://apeswap.finance/logo192.png",
        },
        binance: {
            name: "Binance",
            type: "cex",
            testnet: true,
        },
    },
    production: {
        uniswap: {
            name: "Uniswap V2",
            type: "dex",
        },
        binance: {
            name: "Binance",
            type: "cex",
        },
        kraken: {
            name: "Kraken",
            type: "cex",
        },
    },
};
