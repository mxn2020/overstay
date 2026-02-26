import { ConvexHttpClient } from "convex/browser";

// Using the url from .env.local
const url = "https://colorful-possum-744.eu-west-1.convex.cloud";
const client = new ConvexHttpClient(url);

async function run() {
    try {
        const logs = await client.query("aiLogs:getLogs", { limit: 5 });
        logs.forEach(log => {
            console.log(`[${log.timestamp}] Model: ${log.model} Caller: ${log.caller}`);
            console.log(`Status: ${log.status} HTTP: ${log.httpStatus}`);
            if (log.errorMessage) console.log(`Error: ${log.errorMessage}`);
            console.log("---");
        });
    } catch (e) {
        console.error("No recent logs query available or error:", e);
    }
}
run();
