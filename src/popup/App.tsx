import { useState, useEffect, useCallback } from "react";
import type { PipelineStats, AlgorithmType } from "../algorithms/pipeline";

declare const chrome: any;

const ALGO_LABELS: Record<string, string> = {
  kmp: "KMP",
  "boyer-moore": "Boyer-Moore",
  regex: "RegEx",
  fuzzy: "Fuzzy",
  "aho-corasick": "Aho-Corasick",
  "rabin-karp": "Rabin-Karp",
};

const ALGO_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#a29bfe",
  "#fd79a8",
];

async function getActiveTabId(): Promise<number | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      resolve(tabs[0]?.id);
    });
  });
}

function BarChart({
  data,
  labels,
  colors,
  title,
}: {
  data: number[];
  labels: string[];
  colors: string[];
  title: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#ccc",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {labels.map((label, i) => (
        <div
          key={label}
          style={{
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 90,
              fontSize: 11,
              color: "#aaa",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {label}
          </div>
          <div
            style={{
              flex: 1,
              height: 18,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${(data[i] / max) * 100}%`,
                height: "100%",
                background: colors[i % colors.length],
                borderRadius: 4,
                transition: "width 0.4s ease",
                minWidth: data[i] > 0 ? 4 : 0,
              }}
            />
          </div>
          <div
            style={{
              width: 32,
              fontSize: 11,
              color: "#fff",
              textAlign: "right",
            }}
          >
            {data[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

const ALGO_STAT_KEY: Record<string, keyof PipelineStats["algorithmStats"]> = {
  kmp: "kmp",
  "boyer-moore": "bm",
  regex: "regex",
  fuzzy: "fuzzy",
  "aho-corasick": "ahoCorasick",
  "rabin-karp": "rabinKarp",
};

function getAlgoName(algo: string): string {
  return ALGO_LABELS[algo] || algo;
}

function getAlgoMatches(stats: PipelineStats, algo: AlgorithmType): number {
  return stats.matchesByAlgorithm[algo] || 0;
}

function getAlgoTime(stats: PipelineStats, algo: AlgorithmType): number {
  const key = ALGO_STAT_KEY[algo];
  return key ? stats.algorithmStats[key].time : 0;
}

function getAlgoComparisons(stats: PipelineStats, algo: AlgorithmType): number {
  const key = ALGO_STAT_KEY[algo];
  return key ? stats.algorithmStats[key].comparisons : 0;
}

export default function PopupApp() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [acEnabled, setAcEnabled] = useState(false);
  const [rkEnabled, setRkEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const tabId = await getActiveTabId();
      if (!tabId) {
        setError("No active tab");
        setLoading(false);
        return;
      }
      const resp = await chrome.tabs.sendMessage(tabId, {
        type: "JUDOL_GET_STATS",
      });
      if (resp?.stats) {
        setStats(resp.stats as PipelineStats);
      } else {
        chrome.storage.local.get("judolStats", (result: any) => {
          if (result.judolStats) setStats(result.judolStats as PipelineStats);
        });
      }
    } catch {
      setError("Cannot connect to page");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    chrome.storage.local.get(
      ["judolBlurEnabled", "judolOcrEnabled", "judolUseAC", "judolUseRK"],
      (result: any) => {
        setBlurEnabled(result.judolBlurEnabled === true);
        setOcrEnabled(result.judolOcrEnabled === true);
        setAcEnabled(result.judolUseAC === true);
        setRkEnabled(result.judolUseRK === true);
      },
    );

    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const tabId = await getActiveTabId();
      if (tabId) {
        await chrome.tabs.sendMessage(tabId, { type: "JUDOL_SCAN" });
        setTimeout(async () => {
          await loadStats();
          setScanning(false);
        }, 500);
      }
    } catch {
      setError("Cannot reach page. Try refreshing.");
      setScanning(false);
    }
  };

  const handleClear = async () => {
    try {
      const tabId = await getActiveTabId();
      if (tabId) {
        await chrome.tabs.sendMessage(tabId, { type: "JUDOL_CLEAR" });
        setStats(null);
      }
    } catch {}
  };

  const toggleBlur = async () => {
    const next = !blurEnabled;
    setBlurEnabled(next);
    chrome.storage.local.set({ judolBlurEnabled: next });
    try {
      const tabId = await getActiveTabId();
      if (tabId) {
        await chrome.tabs.sendMessage(tabId, {
          type: "JUDOL_TOGGLE_BLUR",
          enabled: next,
        });
      }
    } catch {}
  };

  const toggleOcr = async () => {
    const next = !ocrEnabled;
    setOcrEnabled(next);
    chrome.storage.local.set({ judolOcrEnabled: next });
    try {
      const tabId = await getActiveTabId();
      if (tabId) {
        await chrome.tabs.sendMessage(tabId, {
          type: "JUDOL_TOGGLE_OCR",
          enabled: next,
        });
      }
    } catch {}
  };

  const toggleAC = async () => {
    const next = !acEnabled;
    setAcEnabled(next);
    chrome.storage.local.set({ judolUseAC: next });
    handleScan();
  };

  const toggleRK = async () => {
    const next = !rkEnabled;
    setRkEnabled(next);
    chrome.storage.local.set({ judolUseRK: next });
    handleScan();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const algoNames: AlgorithmType[] = [
    "kmp",
    "boyer-moore",
    "regex",
    "fuzzy",
    "aho-corasick",
    "rabin-karp",
  ];
  const algoData = algoNames.map((name) => ({
    name: getAlgoName(name),
    matches: stats ? getAlgoMatches(stats, name) : 0,
    time: stats ? getAlgoTime(stats, name) : 0,
    comparisons: stats ? getAlgoComparisons(stats, name) : 0,
  }));

  const keywordEntries = stats?.keywordBreakdown
    ? Object.entries(stats.keywordBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>NantiBisaDiganti</span>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={handleScan} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {stats && (
        <div style={styles.statsContainer}>
          <div style={styles.totalBadge}>
            {stats.totalMatches} keyword{stats.totalMatches !== 1 ? "s" : ""}{" "}
            found
          </div>

          <BarChart
            title="Matches by Algorithm"
            data={algoData.map((d) => d.matches)}
            labels={algoData.map((d) => d.name)}
            colors={ALGO_COLORS}
          />

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Execution Time (ms)</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Algorithm</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Comparisons</th>
                </tr>
              </thead>
              <tbody>
                {algoData
                  .filter((d) => d.matches > 0)
                  .map((d) => (
                    <tr key={d.name}>
                      <td style={styles.td}>{d.name}</td>
                      <td style={styles.td}>{d.time.toFixed(2)}</td>
                      <td style={styles.td}>{d.comparisons}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {keywordEntries.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Top Keywords</div>
              {keywordEntries.map(([kw, count]) => (
                <div key={kw} style={styles.keywordRow}>
                  <span style={styles.keywordName}>{kw}</span>
                  <span style={styles.keywordCount}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!stats && !error && (
        <div style={styles.empty}>
          No results yet. Scan a page to detect judol content.
        </div>
      )}

      <div style={styles.actions}>
        <button
          onClick={handleScan}
          disabled={scanning}
          style={{
            ...styles.btn,
            ...styles.btnPrimary,
            opacity: scanning ? 0.6 : 1,
          }}
        >
          {scanning ? "Scanning..." : "Scan"}
        </button>
        <button
          onClick={handleClear}
          style={{ ...styles.btn, ...styles.btnSecondary }}
        >
          ✕ Clear
        </button>
      </div>

      <div style={styles.toggles}>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={blurEnabled}
            onChange={toggleBlur}
            style={styles.toggleInput}
          />
          <span style={styles.toggleText}>Blur</span>
        </label>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={ocrEnabled}
            onChange={toggleOcr}
            style={styles.toggleInput}
          />
          <span style={styles.toggleText}>OCR</span>
        </label>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={acEnabled}
            onChange={toggleAC}
            style={styles.toggleInput}
          />
          <span style={styles.toggleText}>AC</span>
        </label>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={rkEnabled}
            onChange={toggleRK}
            style={styles.toggleInput}
          />
          <span style={styles.toggleText}>RK</span>
        </label>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 360,
    padding: 16,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    background: "#16213e",
    color: "#eee",
    minHeight: 300,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: 12,
  },
  logo: { fontSize: 24 },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
  } as React.CSSProperties,
  loading: { textAlign: "center", padding: 40, color: "#888" },
  error: {
    background: "rgba(255,107,107,0.2)",
    border: "1px solid #ff6b6b",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 12,
    fontSize: 13,
    color: "#ff6b6b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  retryBtn: {
    background: "#ff6b6b",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 12,
  },
  statsContainer: {},
  totalBadge: {
    background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 20,
    display: "inline-block",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ccc",
    marginBottom: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    padding: "6px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    color: "#888",
    fontWeight: 500,
  },
  td: {
    padding: "6px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  keywordRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 12,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  keywordName: { color: "#ffd93d" },
  keywordCount: { color: "#6bcbff", fontWeight: 600 },
  empty: {
    textAlign: "center",
    padding: 30,
    color: "#666",
    fontSize: 13,
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  btn: {
    flex: 1,
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #6bcbff, #0984e3)",
    color: "#fff",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.1)",
    color: "#ccc",
  },
  toggles: {
    display: "flex",
    gap: 16,
    marginTop: 12,
    fontSize: 12,
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  toggleInput: {
    accentColor: "#6bcbff",
  },
  toggleText: {
    color: "#aaa",
  },
};
