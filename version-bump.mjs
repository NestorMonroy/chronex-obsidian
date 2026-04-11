import { readFileSync, writeFileSync } from "fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const bump = process.argv[2] || "patch";
const newVersion = manifest.version.split(".").map((num, idx) => {
	if (idx === 0 && bump === "major") return +num + 1;
	if (idx === 1 && bump === "minor") return +num + 1;
	if (idx === 2 && bump === "patch") return +num + 1;
	return num;
}).join(".");
manifest.version = newVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[newVersion] = manifest.minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
