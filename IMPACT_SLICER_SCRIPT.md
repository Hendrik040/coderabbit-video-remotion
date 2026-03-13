# Impact Slicer Visualization - Narration Script

## Overview
**Total Duration:** ~90 seconds (adjustable)
**Style:** CodeRabbit brand colors (dark background, orange/aquamarine/pink accents)

---

## SCENE 1: The Problem (0:00 - 0:10)
**Visual:** Split screen showing two code files

**Narration:**
> "A developer adds a new parameter to `calculate_discount`... but forgets to update the caller in `order.py`. This would crash at runtime."

**On Screen:**
- Left: `calculator.py` with NEW signature highlighted
- Right: `order.py` with OLD call highlighted
- Red warning icon appears

---

## SCENE 2: The Pipeline Overview (0:10 - 0:18)
**Visual:** Animated pipeline diagram flows in

**Narration:**
> "Our smart code reviewer catches this automatically using impact slicing. Here's how it works."

**On Screen:**
```
Git Diff → Parse Lines → Detect Signatures → Build Callgraph → Find Callers → Send to LLM
```
(Boxes animate in sequence with arrows connecting them)

---

## SCENE 3: Step 1 - Parse the Diff (0:18 - 0:28)
**Visual:** Git diff output transforms into line numbers

**Narration:**
> "First, we parse the git diff to find exactly which lines changed. In calculator.py, lines 4, 10 through 15 were modified."

**On Screen:**
- Show git diff with `@@` hunk header
- Animate extraction: `{4, 10, 11, 12, 13, 14, 15}`
- Highlight "Line 4 is the function signature"

---

## SCENE 4: Step 2 - Identify Modified Functions (0:28 - 0:38)
**Visual:** AST tree structure appears, function gets highlighted

**Narration:**
> "Next, we walk the AST to find which functions contain these changes. The `calculate_discount` function spans lines 4 to 16 — our changes fall within this range."

**On Screen:**
- Simple AST visualization
- Function box: `calculate_discount (4-16)`
- Changed lines overlay showing they fall inside

---

## SCENE 5: Step 3 - Detect Signature Changes ⭐ (0:38 - 0:52)
**Visual:** Zoom in on line 4, star/key icon appears

**Narration:**
> "Here's the key insight. We check: was the SIGNATURE itself modified? Line 4 — the def line — is in our changed set. This means the function's CONTRACT changed, and callers might be broken."

**On Screen:**
- `def calculate_discount(price, discount_percent, min_purchase)`
- Line 4 pulses with orange glow
- Text appears: "SIGNATURE CHANGED ⭐"
- Badge: "Body changes don't affect callers. Signature changes DO."

---

## SCENE 6: Step 4 - Build the Callgraph (0:52 - 1:02)
**Visual:** Network graph builds showing connections

**Narration:**
> "We scan all Python files and build a callgraph — a map of who calls what. Now we can answer: who calls calculate_discount?"

**On Screen:**
- Nodes appear: `calculator.py`, `order.py`, `test_*.py`
- Edges animate in showing call relationships
- Highlight edge: `order.py → calculate_discount`

---

## SCENE 7: Step 5 - Find Impacted Callers (1:02 - 1:12)
**Visual:** Search animation, order.py lights up

**Narration:**
> "Since the signature changed, we find all callers. The callgraph tells us: order.py calls calculate_discount. We need to check that file."

**On Screen:**
- Query: "Who calls `calculate_discount`?"
- Search ripple effect through graph
- `order.py` glows orange
- Result: `IMPACT FILES: [order.py]`

---

## SCENE 8: Step 6 - Locate the Bug (1:12 - 1:22)
**Visual:** Code snippet appears with call highlighted

**Narration:**
> "We walk through order.py's AST and find the exact call site at line 44. This is the code that might be broken."

**On Screen:**
```python
def apply_discount(self, discount_percent):
    subtotal = self.get_subtotal()
    return calculate_discount(subtotal, discount_percent)  # ← Line 44
```
- Red underline appears under the call
- Annotation: "Missing `min_purchase` argument!"

---

## SCENE 9: Step 7 - Package for LLM (1:22 - 1:32)
**Visual:** Context being assembled into structured format

**Narration:**
> "Finally, we package both pieces for the LLM: the NEW signature and the OLD call. The LLM immediately sees the mismatch."

**On Screen:**
- Two boxes slide together:
  - Box 1: NEW → `calculate_discount(price, percent, min_purchase)`
  - Box 2: OLD → `calculate_discount(subtotal, discount_percent)`
- Gap appears showing missing parameter
- Bug icon with "CONTRACT MISMATCH DETECTED"

---

## SCENE 10: The Result (1:22 - 1:30)
**Visual:** Efficiency comparison

**Narration:**
> "By sending only the relevant code — not the entire codebase — we use 94% fewer tokens while still catching the bug."

**On Screen:**
| Approach | Tokens | Finds Bug? |
|----------|--------|------------|
| Diff Only | ~200 | ❌ |
| All Code | ~19,000 | ✅ |
| Smart Slice | ~1,200 | ✅ |

(Smart Slice row glows orange)

---

## SCENE 11: Key Takeaway (1:30 - 1:38)
**Visual:** Simple flow diagram with emphasis

**Narration:**
> "The key insight: signature change triggers caller search. That's what makes impact slicing both accurate AND efficient."

**On Screen:**
```
Signature Change → Find Callers → Show Both to LLM → Bug Caught
```
(Each step pulses in sequence)

---

## Timing Summary

| Scene | Start | End | Duration |
|-------|-------|-----|----------|
| 1. The Problem | 0:00 | 0:10 | 10s |
| 2. Pipeline Overview | 0:10 | 0:18 | 8s |
| 3. Parse Diff | 0:18 | 0:28 | 10s |
| 4. Identify Functions | 0:28 | 0:38 | 10s |
| 5. Detect Signatures ⭐ | 0:38 | 0:52 | 14s |
| 6. Build Callgraph | 0:52 | 1:02 | 10s |
| 7. Find Callers | 1:02 | 1:12 | 10s |
| 8. Locate Bug | 1:12 | 1:22 | 10s |
| 9. Package for LLM | 1:22 | 1:28 | 6s |
| 10. Efficiency | 1:28 | 1:34 | 6s |
| 11. Takeaway | 1:34 | 1:40 | 6s |

**Total: ~100 seconds (1:40)**

---

## Notes for Animation

- Use CodeRabbit orange (#FF570A) for highlights and important elements
- Use aquamarine (#25BAB1) for code/technical elements
- Use pink (#F2B8EB) for secondary accents
- Dark background (#171717) throughout
- Subtle grid pattern in background (like the intro)
- Code uses monospace font with syntax highlighting
