import Hydrations from "../lib/hydration";
import "../styles/globals.css";

// import { WagmiConfig, createClient } from "wagmi";
// import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { Toaster } from "@/components/ui/toaster";

// const client = createClient(
//     getDefaultClient({
//         appName: "Arbitrage Bot",
//         // alchemyId,
//     })
// );

function MyApp({ Component, pageProps }) {
    return (
        // <WagmiConfig client={client}>
        //     <ConnectKitProvider>
        <>
            <Component {...pageProps} />
            <Toaster />
            <Hydrations />
        </>
        //     </ConnectKitProvider>
        // </WagmiConfig>
    );
}

export default MyApp;
