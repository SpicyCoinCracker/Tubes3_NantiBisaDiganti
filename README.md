# Judol Detector NantiBisaDiganti - Browser Extension

Chrome extension untuk mendeteksi konten judi online pada halaman web menggunakan algoritma _pattern matching_.

## Algoritma

### Knuth-Morris-Pratt (KMP)

Mencocokkan string dengan memanfaatkan _failure function_ untuk menghindari perbandingan ulang. Cocok untuk pencarian pattern tunggal dalam teks.

### Boyer-Moore (BM)

Mencocokkan string dari kanan ke kiri menggunakan _last occurrence table_ dan _good suffix table_ untuk lompatan lebih efisien.

### RegEx

Mendeteksi pola `<kata><angka>` (contoh: `GACOR99`, `MAXWIN234`) menggunakan JavaScript RegExp.

### Weighted Levenshtein Distance (Fuzzy)

Menghitung kemiripan string dengan bobot lebih kecil untuk karakter yang mirip secara visual (contoh: `0`↔`O`, `1`↔`I`, `4`↔`A`).

### Bonus: Aho-Corasick & Rabin-Karp

- **Aho-Corasick**: Mencari banyak pattern sekaligus melalui _trie_ dan _failure links_.
- **Rabin-Karp**: Mencari pattern menggunakan _rolling hash_.

## Requirement

- Node.js ≥ 18
- npm

## Instalasi & Build

```bash
npm install
npm run build
```

Hasil build tersimpan di folder `dist/`.

## Cara Load di Chrome

1. Buka `chrome://extensions/`
2. Aktifkan **Developer Mode**
3. Klik **Load Unpacked**
4. Pilih folder `dist/`

## Struktur Proyek

```
judol-detector/
├── public/
│   ├── manifest.json
│   └── images/
├── src/
│   ├── algorithms/        # Implementasi algoritma
│   │   ├── kmp.ts
│   │   ├── boyer-moore.ts
│   │   ├── regex.ts
│   │   ├── levenshtein.ts
│   │   ├── aho-corasick.ts
│   │   ├── rabin-karp.ts
│   │   ├── normalize.ts
│   │   └── pipeline.ts
│   ├── content/           # Content script
│   │   ├── content.ts
│   │   ├── context.ts
│   │   ├── scanner.ts
│   │   ├── highlighter.ts
│   │   ├── tooltip.ts
│   │   ├── blur.ts
│   │   ├── ocr.ts
│   │   └── keywordLoader.ts
│   ├── popup/             # Popup UI (React)
│   │   └── App.tsx
│   └── styles/            # Stylesheet
│       ├── content.css
│       └── index.css
├── keywords/
│   └── keywords.txt
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Author

| Nama                      | NIM          |
| ------------------------- | ------------ |
| _Fazri Arrashyi Putra_    | _(13524127)_ |
| _Ahmad Rinofaros Muchtar_ | _(13524138)_ |
| _Muh. Hartawan Haidir_    | _(13524147)_ |

Tugas Besar 3 IF2211 Strategi Algoritma
Semester II 2025/2026
Institut Teknologi Bandung
