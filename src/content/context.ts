import { PipelineMatch, PipelineStats, runPipeline, deduplicateMatches } from '../algorithms/pipeline';
import { scanDOM } from './scanner';
import { highlightMatch, removeHighlights } from './highlighter';
import { attachTooltipEvents, detachTooltipEvents } from './tooltip';
import { loadKeywordsFromFile } from './keywordLoader';

declare const chrome: any;

let isScanning = false;
let lastStats: PipelineStats | null = null;

function matchMapFromMatches(matches: PipelineMatch[]): Map<number, PipelineMatch> {
    const matchMap = new Map<number, PipelineMatch>();
    const sorted = [...matches].sort((a, b) => a.index - b.index);
    for (const m of sorted) {
        if (!matchMap.has(m.index)) {
            matchMap.set(m.index, m);
        }
    }
    return matchMap;
}

function containsManual(text: string, pattern: string): boolean {
    if (pattern.length === 0) return false;
    for (let i = 0; i <= text.length - pattern.length; i++) {
        let match = true;
        for (let j = 0; j < pattern.length; j++) {
            if (text[i + j] !== pattern[j]) { match = false; break; }
        }
        if (match) return true;
    }
    return false;
}

export async function scanPage(): Promise<PipelineStats | null> {
    if (isScanning) return null;
    isScanning = true;

    try {
        removeHighlights();
        detachTooltipEvents();

        const keywords = await loadKeywordsFromFile();
        const segments = scanDOM();
        const fullText = segments.map(s => s.text).join('\n');

        if (fullText.trim().length === 0) {
            isScanning = false;
            return null;
        }

        const algoPrefs = await new Promise<{
            useAC: boolean; useRK: boolean;
        }>((resolve) => {
            chrome.storage.local.get(
                ['judolUseAC', 'judolUseRK'],
                (r: any) => resolve({
                    useAC: r.judolUseAC === true,
                    useRK: r.judolUseRK === true,
                })
            );
        });

        const { matches, stats } = runPipeline(
            fullText,
            keywords,
            true,
            true,
            true,
            true,
            algoPrefs.useAC,
            algoPrefs.useRK
        );

        const uniqueMatches = deduplicateMatches(matches);
        const matchMap = matchMapFromMatches(uniqueMatches);

        let globalOffset = 0;
        for (const seg of segments) {
            const segLen = seg.text.length;

            const segMatches: { match: PipelineMatch; localOffset: number }[] = [];
            for (const [globalIdx, m] of matchMap) {
                if (globalIdx >= globalOffset && globalIdx < globalOffset + segLen) {
                    segMatches.push({ match: m, localOffset: globalIdx - globalOffset });
                }
            }

            segMatches.sort((a, b) => b.localOffset - a.localOffset);

            let currentTextNode: Text = seg.node;
            for (const sm of segMatches) {
                const matchText = sm.match.matchText || sm.match.keyword;
                const endOffset = sm.localOffset + matchText.length;

                if (endOffset <= (currentTextNode.textContent || '').length) {
                    highlightMatch(currentTextNode, sm.localOffset, endOffset, {
                        keyword: sm.match.keyword,
                        algorithm: sm.match.algorithm,
                        executionTime: sm.match.executionTime,
                        comparisons: sm.match.comparisons,
                        matchText: matchText,
                    });
                }

                const parent = currentTextNode.parentNode;
                if (parent) parent.normalize();

                const walker = document.createTreeWalker(
                    seg.node.parentNode || document.body,
                    NodeFilter.SHOW_TEXT
                );
                let found: Text | null = null;
                let n: Text | null;
                while ((n = walker.nextNode() as Text | null) !== null) {
                    const tc = n.textContent || '';
                    if (containsManual(tc, matchText)) {
                        found = n;
                        break;
                    }
                }
                if (found) currentTextNode = found;
            }

            globalOffset += segLen + 1;
        }

        attachTooltipEvents();
        lastStats = stats;

        chrome.storage.local.set({ judolStats: stats, judolLastScan: Date.now() });

        return stats;
    } catch (e) {
        console.error('NantiBisaDiganti scan error:', e);
        return null;
    } finally {
        isScanning = false;
    }
}

export function clearHighlights(): void {
    removeHighlights();
    detachTooltipEvents();
    lastStats = null;
    chrome.storage.local.set({ judolStats: null });
}

export function getLastStats(): PipelineStats | null {
    return lastStats;
}
