#!/bin/bash
OUTPUT="context_bundle.txt"
> "$OUTPUT"

echo "Extracting surgical contexts..."

append_chunk() {
    echo -e "\n\n### FILE: $1 (Lines $2)" >> "$OUTPUT"
    sed -n "$2p" "$1" >> "$OUTPUT"
}

# Gap 1: Secret Redaction (Head is fine here)
echo -e "\n### FILE: src/sowwy/security/redact.ts (Lines 1-198)" >> "$OUTPUT"
head -n 198 src/sowwy/security/redact.ts >> "$OUTPUT"

# Gap 2: Kill Switch Persistence
append_chunk "src/sowwy/smt/throttler.ts" "101,180"

# Gap 3: Refinement Loop Spam
append_chunk "src/sowwy/extensions/continuous-self-modify/index.ts" "54,112"

# Gap 4: Identity Spine Backup (Combined logic)
append_chunk "src/sowwy/identity/lancedb-store.ts" "130,150"
echo -e "\n### FILE: src/sowwy/identity/fragments.ts (Lines 1-70)" >> "$OUTPUT"
head -n 70 src/sowwy/identity/fragments.ts >> "$OUTPUT"

# Gap 5: Audit Log Integrity
# WIDENED RANGE: Need to see class context to suggest where to store 'prevHash'
append_chunk "src/sowwy/memory/consolidation.ts" "620,660"

echo "Done. Content saved to $OUTPUT ($(wc -l < "$OUTPUT") lines)"
