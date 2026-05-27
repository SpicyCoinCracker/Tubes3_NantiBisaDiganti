import { boyerMooreSearch, lastOccurenceTable } from "./boyer-moore";

// Test 1: Last Occurrence Table
const table = lastOccurenceTable("GACOR");
console.log("G:", table.get("G")); // Expected: 0
console.log("R:", table.get("R")); // Expected: 4
console.log("Z:", table.get("Z")); // Expected: undefined → pakai ?? -1

// Test 2: kata ditemukan
const r1 = boyerMooreSearch("Situs SLOT GACOR terpercaya", "GACOR");
console.log("Test 2:", r1.indices);
// Expected: [11]

// Test 3: tidak ditemukan
const r2 = boyerMooreSearch("Halo selamat datang", "GACOR");
console.log("Test 3:", r2.indices);
// Expected: []

// Test 4: ditemukan lebih dari sekali
const r3 = boyerMooreSearch("GACOR MAXWIN GACOR JP GACOR", "GACOR");
console.log("Test 4:", r3.indices);
// Expected: [0, 13, 22]

// Test 5: case insensitive
const r4 = boyerMooreSearch("situs gacor paling hoki", "GACOR");
console.log("Test 5:", r4.indices);
// Expected: [6]