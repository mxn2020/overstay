import fs from 'fs';
import { execSync } from 'child_process';

const imgPath = '/Users/mehdinabhani/.gemini/antigravity/brain/fb17a7bb-7c4e-4fbb-90a5-f8240b5b804e/chair_test_image_1772117757904.png';
const base64 = fs.readFileSync(imgPath).toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

const args = JSON.stringify({
    imageBase64: dataUrl,
    mode: "single"
});

// Since the argument can be very large, it's safer to write to a file and read from it if convex supported that, 
// but npx convex run accepts stringified JSON. Let's see if we hit command line limits.
console.log("Running convex action...");
try {
    const output = execSync(`npx convex run nvidia:runPipeline '${args}'`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log("Output:", output);
} catch (e) {
    console.error("Error running convex.");
}
