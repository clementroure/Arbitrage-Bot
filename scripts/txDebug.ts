import { ethers } from "ethers";

async function decodeLogsFromClipboard() {
    try {
        const pbpaste = Bun.spawnSync(["pbpaste"]);
        const rawLogs = pbpaste.stdout.toString();
        const logs = JSON.parse(rawLogs);
        console.log(`Logs read from clipboard: ${logs.length} entries`);
        findAndDecodeLogs(logs);
    } catch (err) {
        console.error(`Error reading or processing log file: ${err.message}`);
    }
}

const findAndDecodeLogs = (logEntry) => {
    if (
        logEntry.to === "0x000000000000000000636f6e736f6c652e6c6f67" &&
        logEntry.type === "STATICCALL"
    ) {
        const logFuncSignature = logEntry.input.slice(0, 10);
        const message = ethers.utils.defaultAbiCoder.decode(
            ["string"],
            "0x" + logEntry.input.slice(logFuncSignature.length)
        );
        let decodedMessage = message[0];
        // Count how many %s are in the message
        const numPlaceholders = decodedMessage.split("%s").length - 1;
        // If there are placeholders, we need to decode the rest of the input
        if (numPlaceholders > 0) {
            const decoded = ethers.utils.defaultAbiCoder.decode(
                new Array(numPlaceholders).fill("address"),
                "0x" + logEntry.input.slice(logFuncSignature.length + 64)
            );
            // Replace the placeholders with the decoded addresses or number if the address starts with a few 0s
            for (const address of decoded) {
                if (address.startsWith("0x000000")) {
                    decodedMessage = decodedMessage.replace(
                        "%s",
                        ethers.utils.formatUnits(address, 18)
                    );
                    continue;
                }
                decodedMessage = decodedMessage.replace("%s", address);
            }
        }
        console.log(decodedMessage);
    }
    for (const key in logEntry) {
        if (
            (Array.isArray(logEntry[key]) ||
                typeof logEntry[key] === "object") &&
            logEntry[key] !== null
        ) {
            findAndDecodeLogs(logEntry[key]);
        }
    }
};

// Invoke the function
decodeLogsFromClipboard();
