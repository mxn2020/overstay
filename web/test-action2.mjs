import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

// Using the url from .env.local
const url = "https://colorful-possum-744.eu-west-1.convex.cloud";
const client = new ConvexHttpClient(url);

const imgPath = '/Users/mehdinabhani/.gemini/antigravity/brain/fb17a7bb-7c4e-4fbb-90a5-f8240b5b804e/chair_test_image_1772117757904.png';
const base64 = fs.readFileSync(imgPath).toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

async function run() {
    try {
        console.log("Calling nvidia:runPipeline...");
        const res = await client.action("nvidia:runPipeline", { imageBase64: dataUrl, mode: "single" });
        console.log("Result:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error calling pipeline:", e);
    }
}
run();
