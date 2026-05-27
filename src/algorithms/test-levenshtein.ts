import { weightedLevenshtein, isFuzzyMatch, fuzzySearchAll } from "./levenshtein";

// Test 1: exact same → 0
console.log("Test 1:", weightedLevenshtein("GACOR", "GACOR"));
// Expected: 0

// Test 2: obfuskasi O→0 → jarak kecil
console.log("Test 2:", weightedLevenshtein("GAC0R", "GACOR"));
// Expected: 0.1 (bukan 1.0)

// Test 3: obfuskasi H0K1 → HOKI
console.log("Test 3:", weightedLevenshtein("H0K1", "HOKI"));
// Expected: 0.2 (dua substitusi ringan)

// Test 4: kata berbeda → jarak besar
console.log("Test 4:", weightedLevenshtein("KUCING", "GACOR"));
// Expected: > 1.5

// Test 5: isFuzzyMatch
console.log("Test 5:", isFuzzyMatch("GAC0R", "GACOR"));   // true
console.log("Test 6:", isFuzzyMatch("SL0T", "SLOT"));     // true
console.log("Test 7:", isFuzzyMatch("KUCING", "GACOR"));  // false

// Test 8: fuzzySearchAll di teks
const hasil = fuzzySearchAll(
  "Daftar di situs SL0T terbaik, main GAC0R menang H0K1",
  ["SLOT", "GACOR", "HOKI"]
);
console.log("Test 8:", hasil);
// Expected: SL0T→SLOT, GAC0R→GACOR, H0K1→HOKI