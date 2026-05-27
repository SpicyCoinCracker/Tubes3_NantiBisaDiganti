import { kmpSearch, failureFunction } from "./kmp";

// Test 1: failure function
const ff = failureFunction("GACORGAC");
console.log("Failure function:", ff);
// Expected: [0, 0, 0, 0, 0, 1, 2, 3]

// Test 2: kata ditemukan
const r1 = kmpSearch("Situs SLOT GACOR terpercaya", "GACOR");
console.log("Test 2:", r1.indices); 
// Expected: [11]

// Test 3: tidak ditemukan
const r2 = kmpSearch("Halo selamat datang", "GACOR");
console.log("Test 3:", r2.indices); 
// Expected: []

// Test 4: ditemukan lebih dari sekali
const r3 = kmpSearch("GACOR MAXWIN GACOR JP GACOR", "GACOR");
console.log("Test 4:", r3.indices); 
// Expected: [0, 13, 22]

// Test 5: case insensitive
const r4 = kmpSearch("situs gacor paling hoki", "GACOR");
console.log("Test 5:", r4.indices); 
// Expected: [6]