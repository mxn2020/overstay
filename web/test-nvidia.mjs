import fs from "fs";

const apiKey = "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";
const imgPath = '/Users/mehdinabhani/.gemini/antigravity/brain/fb17a7bb-7c4e-4fbb-90a5-f8240b5b804e/chair_test_image_1772117757904.png';
const base64 = fs.readFileSync(imgPath).toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

const bodyObj = {
    model: "moonshotai/kimi-k2.5",
    messages: [
        { role: 'system', content: "Guardrail system prompt test" },
        {
            role: 'user',
            content: [
                { type: 'text', text: "Is this a night out?" },
                { type: 'image_url', image_url: { url: dataUrl } },
            ],
        },
    ],
    temperature: 0.1,
    max_tokens: 512,
    top_p: 0.9,
    stream: false
};

async function run() {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyObj),
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text.substring(0, 1000));
}

run();
