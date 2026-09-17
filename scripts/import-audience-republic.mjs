import { readFile, writeFile } from "node:fs/promises";

const source = process.argv[2];
if (!source) throw new Error("Pass the Audience Republic CSV path as the first argument.");

const tours = [
  ["MKTO", ["mkto"]], ["Brother Ali", ["brother ali", "horrorshow/brother ali"]], ["Dan Does Footy", ["dan does footy", "ddf"]],
  ["28 Days", ["28 days", "28dayspt2"]], ["VSPY VSPY", ["vspy"]], ["SOULWAVE", ["soulwave"]],
  ["You Am I", ["you am i", "yai"]], ["harrykirby", ["harrykirby", "harry kirby"]],
  ["Less Than Jake", ["less than jake", "ltj", "circus down under"]], ["Talib Kweli", ["talib kweli", "talib"]],
  ["The Black Seeds", ["the black seeds", "black seeds"]], ["Eric Hutchinson", ["eric hutchinson", "eric hutch"]],
  ["Shapeshifter", ["shapeshifter"]], ["Good Things Festival", ["good things"]], ["Clutch", ["clutch"]], ["Will Sparks", ["will sparks", "classics", "will2027"]],
];

function parseCsv(text) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(value); rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

const rows = parseCsv(await readFile(source, "utf8"));
const headers = rows.shift();
const messages = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])) ).map((message) => {
  const haystack = `${message.message_name} ${message.subject}`.toLowerCase();
  const tour = tours.find(([, terms]) => terms.some((term) => haystack.includes(term)))?.[0];
  if (!tour) return null;
  return {
    tour, type: message.subject.trim() ? "Email" : "SMS", sentAt: message.send_date,
    name: message.message_name, subject: message.subject, recipients: Number(message.recipients || 0),
    opens: Number(message.unique_opens || 0), clicks: Number(message.unique_clicks || 0), revenue: Number(message.revenue || 0),
  };
}).filter(Boolean);

await writeFile("docs/data/audience-republic.json", JSON.stringify({ importedAt: new Date().toISOString(), messages }, null, 2));
console.log(`Imported ${messages.length} matched Audience Republic sends.`);
