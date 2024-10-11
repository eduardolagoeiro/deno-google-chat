// Importing Deno standard library functions
import { load } from "https://deno.land/std@0.212.0/dotenv/mod.ts";

// Load environment variables
const env = await load();
const webhookUrl = env.WEBHOOK_URL;

if (!webhookUrl) {
  console.error("Error: WEBHOOK_URL environment variable is not set.");
  Deno.exit(1);
}

// Function to flatten nested objects into a one-dimensional key-value structure
function flattenObject(
  // deno-lint-ignore no-explicit-any
  obj: Record<string, any>,
  parentKey = "",
  result: Record<string, string> = {}
): Record<string, string> {
  for (const key in obj) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      flattenObject(obj[key], newKey, result);
    } else {
      result[newKey] = Array.isArray(obj[key])
        ? obj[key].join(", ")
        : String(obj[key]);
    }
  }
  return result;
}

// Function to build a Google Chat card with key-value pairs and send it
// deno-lint-ignore no-explicit-any
async function sendFlattenedJsonCard(jsonData: Record<string, any>) {
  // Flatten the JSON object
  const flattenedData = flattenObject(jsonData);

  // Build the widgets for the card
  const widgets = Object.entries(flattenedData).map(([key, value]) => ({
    keyValue: {
      topLabel: key,
      content: value,
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

// Main function to execute the process
async function main() {
  const jsonData = await readJsonFile("./send-json.json");
  await sendFlattenedJsonCard(jsonData);
}

// Execute the main function
main();
