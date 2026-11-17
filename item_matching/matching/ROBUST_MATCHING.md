# Robust matching experiment

**Integration update:** live Supabase text matching and shared UI review state
are now implemented. See `item_matching/evaluation/integration/` for saved integration test results. The dataset-only UI notes below describe the earlier stage.

`robust_matcher.py` adds a second method; the original `text_matcher.py` and its
saved results remain available as a baseline. No API key or model fine-tuning is
required. Inference runs locally on CPU. The first run downloads model weights.

## Run

From the repository root, using the existing environment:

```bash
backend/.venv/bin/python -m pip install -r item_matching/requirements-semantic.txt
backend/.venv/bin/python item_matching/matching/robust_matcher.py
backend/.venv/bin/python item_matching/evaluation/stress/compare_robust.py
PYTHONPATH=backend:item_matching backend/.venv/bin/python -m pytest item_matching/test backend/test/test_matching_service.py -q
```

For an already downloaded model on an offline machine, prefix generation and
comparison commands with `HF_HUB_OFFLINE=1`. Model downloads require internet.
The generated file is `item_matching/robust_results.json`. Regenerate it after
changing records, descriptions or scoring rules. Original JSON data and
`text_results.json` are not overwritten. Optional `--output PATH` writes a
separate results file, but the API always reads the default file.

## How it works

The model is
[sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2).
The implementation follows its model-card attention-mask mean pooling approach
and normalizes sentence vectors before taking their dot product. Inputs are
truncated to 128 tokens, matching the model's sentence-transformer configuration.
Description vectors are cached within each generation run and generated in
batches. Titles and tags are used only when a description is absent, so stale
identical tags cannot overwhelm contradictory descriptions.

The heuristic score is semantic similarity (negative values clamped to zero)
weighted to 50 points, category up to 20, location up to 15, and date up to 15.
The existing date eligibility rule remains in effect. Similarity below 0.45 or
an explicit detected conflict caps the score at 49. Scores are not probabilities.
The score threshold of 70 and semantic gate are experimental and not calibrated
on independent reports.

Conservative English attribute checks cover:
- different explicit screen sizes in inches (including selected written numbers);
- different explicit key counts;
- disjoint colours directly modifying supported object nouns;
- sticker presence versus explicit absence.

Missing details do not count as contradictions. These rules are intentionally
limited: general negation, Finnish attribute extraction, ambiguous colours,
references to multiple objects and other conflicting attributes are not solved.
Description precedence also means a wrong description can lose useful title
information. Long descriptions can lose important details through truncation.

## UI and API

The Matches page defaults to the robust method and offers an **Original text
matcher** selector for comparison. Both use saved local results, not live
Supabase matching. Routes:

- `/matches/dataset`: robust scores >=70, at most three per lost report.
- `/matches/dataset?source=baseline`: original text scores.
- `/matches/dataset?source=robust&min_score=75&top_k=5`: explicit controls.

Image cosine breaks equal-text-score ties only; it does not increase text
scores, rescue low-scoring pairs or override conflicts. This is conservative
use of image evidence, not a trained/calibrated text-image fusion model. CLIP
itself is unchanged. At the default threshold, both methods still rank the true
candidate first for every lost report in this small original dataset.
A report with no eligible candidate has no returned suggestion. Confirm/dismiss
is still temporary. Dataset previews still are not authenticated user matches.
If robust results are missing, the API reports an error rather than silently
switching algorithms. Select baseline or generate the robust file.

## Development comparison

`evaluation/stress/robust_comparison.json` records the measured outcomes:

| Evaluation at score 70 | Original | Robust |
| --- | --- | --- |
| True positives on original dataset | 48 | 48 |
| False positives on original dataset | 1 | 4 |
| Missed true pairs | 0 | 0 |
| Precision | 97.96% | 92.31% |
| Hard description checks passed | 8/24 | 22/24 |

Both remaining hard misses use an indirect description of keys. Avoid lowering
the global cutoff solely to pass these examples: false positives already grew.
These fixtures informed implementation; this comparison is a development
regression check, NOT held-out validation. Ground-truth completeness and the
closed-world negative assumption remain limitations. Some improvements are
expected because explicit rules target the already-inspected failures. Collect
independent real descriptions/photos before claiming generalization.

77 functional/API-service tests pass, and the frontend production build passes.
No claim is made that the system automatically proves ownership or handles all
real-world descriptions. Human ownership verification remains necessary.
