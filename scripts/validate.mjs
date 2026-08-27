import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = new URL("..", import.meta.url);
const schema = JSON.parse(fs.readFileSync(new URL("schema/policy.cancellation.schema.json", root), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

function jsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? jsonFiles(target) : entry.name.endsWith(".json") ? [target] : [];
  });
}

let checked = 0;
for (const filename of jsonFiles(new URL("examples", root))) {
  const document = JSON.parse(fs.readFileSync(filename, "utf8"));
  for (const policy of document.policies ?? []) {
    if (policy.type !== "io.github.yairsabag.policy.cancellation") continue;
    checked += 1;
    if (!validate(policy)) {
      console.error(`\n${filename}`);
      console.error(validate.errors);
      process.exitCode = 1;
    }
  }
}

if (checked === 0) throw new Error("No cancellation policy examples were found");
if (!process.exitCode) console.log(`Validated ${checked} cancellation policy entries.`);
