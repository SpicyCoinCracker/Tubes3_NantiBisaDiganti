import { MatchResult } from "./kmp";

export function lastOccurenceTable (pattern: string): Map<string, number> {
    const table = new Map<string, number>();

    for (let i = 0; i < pattern.length; i++) {
        table.set(pattern[i], i);
    }
    return table;
}

export function goodSuffixTable(pattern: string): number[] {
    const m = pattern.length;
    const shift: number[] = new Array(m + 1).fill(m);
    const border: number[] = new Array(m + 1).fill(0);

    let i = m;
    let j = m + 1;
    border[i] = j;

    while (i > 0) {
        while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
            if (shift[j] === m) {
                shift[j] = j - i;
            }
            j = border[j];
        }
        i--;
        j--;
        border[i] = j;
    }
    j = border[0];
    for (i = 0; i <= m; i++) {
        if (shift[i] === m) {
            shift[i] = j;
        }
        if (i === j) {
            j = border[j];
        }
    }
    return shift;
}

/**
 * Mencari semua kemunculan pattern di dalam text
 * menggunakan algoritma Boyer-Moore
 * 
 * @param text    - teks yang akan dicari
 * @param pattern - kata kunci yang dicari
 * @returns MatchResult berisi posisi, waktu, dan jumlah perbandingan
 */
export function boyerMooreSearch (text: string, pattern: string): MatchResult {
    const startTime = performance.now();
    const indices: number[] = [];
    let comparisons = 0;

    const n = text.length;
    const m = pattern.length;

    if (m === 0 || m > n) {
        return {
            indices: [],
            executionTime: performance.now() - startTime,
            comparisons: 0,
        };
    }
    const textUpper = text.toUpperCase();
    const patternUpper = pattern.toUpperCase();
    const lastOccurence = lastOccurenceTable(patternUpper);
    const goodSuffix = goodSuffixTable(patternUpper);

    let i = 0;
    while (i <= n - m) {
        let j = m - 1;

        while (j >= 0 && patternUpper[j] === textUpper[i + j]) {
            comparisons++;
            j--;
        } 

        if (j < 0) {
            indices.push(i);
            i += goodSuffix[0];
        } else {
            comparisons++;

            const lastPos = lastOccurence.get(textUpper[i + j]) ?? -1;
            const badCharShift = j - lastPos;
            const goodSuffixShift = goodSuffix[j + 1];

            i += Math.max(badCharShift, goodSuffixShift);
        }
    }
    return {
        indices,
        executionTime: performance.now() - startTime,
        comparisons,
    };
}

/**
 * Mencari semua keyword sekaligus menggunakan BM
 * 
 * @param text     - teks yang akan dicari
 * @param keywords - array kata kunci
 * @returns Map dari keyword ke MatchResult-nya
 */
export function bmSearchMultiple(
  text: string,
  keywords: string[]
): Map<string, MatchResult> {
  const results = new Map<string, MatchResult>();

  for (const keyword of keywords) {
    const result = boyerMooreSearch(text, keyword);
    if (result.indices.length > 0) {
      results.set(keyword, result);
    }
  }

  return results;
}