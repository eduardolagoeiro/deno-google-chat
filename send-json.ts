import "@std/dotenv/load";
import { flatten } from "https://deno.land/x/flatten@1.1.0/mod.ts";

// Get the webhook URL from the environment variables
const webhookUrl = Deno.env.get("WEBHOOK_URL");

if (!webhookUrl) {
  throw new Error("WEBHOOK_URL environment variable is not set.");
}

// Function to build a Google Chat card with key-value pairs and send it
async function sendFlattenedJsonCard(
  webhookUrl: string,
  // deno-lint-ignore no-explicit-any
  jsonData: Record<string, any>
) {
  // Flatten the JSON object using the flatten module
  const flattenedData = flatten(jsonData);

  // Build the widgets for the card
  const widgets = Object.entries(flattenedData).map(([key, value]) => ({
    keyValue: {
      topLabel: key,
      content: String(value),
    },
  }));

  // Create the card payload
  const cardPayload = {
    cards: [
      {
        header: {
          title: "Flattened JSON Data",
          subtitle: "Key-value pairs from nested JSON",
        },
        sections: [
          {
            widgets: widgets,
          },
        ],
      },
    ],
  };

  // Send the card using fetch
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardPayload),
    });

    if (!response.ok) {
      throw new Error(`Error sending card: ${response.statusText}`);
    }

    console.log("Card sent successfully.");
  } catch (error) {
    console.error("Error sending card:", error);
  }
}

// Function to read the JSON payload from 'send-json.json'
// deno-lint-ignore no-explicit-any
async function readJsonFile(filePath: string): Promise<Record<string, any>> {
  try {
    const data = await Deno.readTextFile(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file: ${error}`);
    Deno.exit(1);
  }
}

const jsonData = await readJsonFile("./send-json.json");
await sendFlattenedJsonCard(webhookUrl, jsonData);
