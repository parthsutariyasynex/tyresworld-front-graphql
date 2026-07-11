const fs = require("fs");
const path = require("path");

function parseCSV(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current);
    if (fields.length >= 2) {
      const key = fields[0].trim();
      const val = fields[1].trim();
      if (key) {
        result[key] = val;
      }
    }
  }
  return result;
}

try {
  const localesDir = path.join(__dirname, "../public/locales");
  const csvDir = path.join(__dirname, "../public/csv");

  // Read JSON files
  const enJsonPath = path.join(localesDir, "en.json");
  const arJsonPath = path.join(localesDir, "ar.json");
  const enJson = fs.existsSync(enJsonPath) ? JSON.parse(fs.readFileSync(enJsonPath, "utf8")) : {};
  const arJson = fs.existsSync(arJsonPath) ? JSON.parse(fs.readFileSync(arJsonPath, "utf8")) : {};

  // Read CSV files
  const enCsvPath = path.join(csvDir, "en_US.csv");
  const arCsvPath = path.join(csvDir, "ar_SA.csv");
  const enCsv = fs.existsSync(enCsvPath) ? parseCSV(fs.readFileSync(enCsvPath, "utf8")) : {};
  const arCsv = fs.existsSync(arCsvPath) ? parseCSV(fs.readFileSync(arCsvPath, "utf8")) : {};

  // Merge CSV into JSON dictionaries
  const enCompiled = { ...enJson, ...enCsv };
  const arCompiled = { ...arJson, ...arCsv };

  // Write compiled JSON files
  fs.writeFileSync(path.join(localesDir, "compiled-en.json"), JSON.stringify(enCompiled, null, 2));
  fs.writeFileSync(path.join(localesDir, "compiled-ar.json"), JSON.stringify(arCompiled, null, 2));

  console.log("Translations compiled successfully.");
} catch (err) {
  console.error("Failed to compile translations:", err);
  process.exit(1);
}
