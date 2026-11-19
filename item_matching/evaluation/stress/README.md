# Matching quality audit

These checks run the existing matching code directly, without the backend, a
Supabase connection, or Gemini. Original item files, images, and saved results
are not overwritten. All findings are diagnostic, not proof of performance on
new reports.

From the repository root:

```bash
backend/.venv/bin/python -m pip install pytest -r item_matching/requirements-image.txt
PYTHONPATH=item_matching backend/.venv/bin/python -m pytest item_matching/test -q
backend/.venv/bin/python item_matching/evaluation/stress/run_checks.py
backend/.venv/bin/python item_matching/evaluation/stress/check_images.py
```

The image audit downloads the same pretrained CLIP model as the image matcher
on its first run. Subsequent runs can use the model cache. It runs inference on
CPU and writes image_stress_report.json. run_checks.py writes quality_report.json.

## What was checked

- 47 functional checks, including unknown/malformed dates, reversed chronology,
  empty evidence, numeric/null text values, image path resolution, cosine vector
  geometry, and invalid embedding shapes.
- Fresh text scores for every chronologically valid pair in the 48 lost / 68
  found dataset, threshold sweeps, candidate ranking, and false/missed examples.
- 12 hand-written description scenarios, each tested with original titles/tags
  and with titles/tags removed (24 checks). Category, location and dates remain
  unchanged so these cases isolate description sensitivity. Edit text_cases.json
  to add manual cases or change wording, then rerun run_checks.py.
- Every local image resolves and decodes; no exact decoded-pixel duplicates.
- Fresh CLIP inference for original images, horizontal flip, 90-degree rotation,
  half brightness, a central crop, and right-third occlusion of found images.
  Lost images stay unchanged. Perturbations operate on preprocessed tensors;
  they are synthetic robustness probes, not photographs from different angles.

Negative text scenarios deliberately describe fictional *different* objects
while keeping dataset IDs as references to category/date/location. They do not
change the original ground truth. The original-title/tag variant deliberately
retains potentially stale tags; it measures whether contradictory descriptions
can overcome otherwise very similar metadata. These scenarios are adversarial
examples, not a representative sample for estimating real-world accuracy.

## Results

At the UI's text cutoff of 70, the original dataset returns 48 true positives,
1 false positive and no misses: precision 97.96%, recall 100%. The correct
candidate ranks first for all 48 reports. This dataset is easy: many true pairs
have almost identical titles, tags and descriptions.

Only **8/24** harder description checks pass at the same cutoff. Examples:

- Wallet paraphrase without title/tags: 61 (missed).
- Finnish description without title/tags: 62 (missed).
- Wallet with a red sticker vs wallet explicitly WITHOUT it: 81 (false match).
- 13-inch vs 17-inch laptop: 86 (false match).
- Long boilerplate and short paraphrase: 56 (missed).

SequenceMatcher measures character sequence overlap, not meaning. It is
sensitive to phrasing, word order and length; it cannot reliably understand
negation, numbers or translations. Shared category/location/date and duplicated
titles/tags can also overpower contradictory descriptions. Lowering the cutoff
alone trades misses for false positives and does not solve these issues.

Fresh original-image inference matches the saved aggregate results: at cosine
0.8, 41 true positives, 41 false positives and 7 misses (precision 50%, recall
85.42%). The correct object ranks first for 44/48 lost reports (91.67%), within
three for 47/48, and within five for all 48.

| Found-image input | Correct top candidate | Recall at cosine 0.8 |
| --- | --- | --- |
| Original | 44/48 | 85.42% |
| Horizontal flip | 40/48 | 83.33% |
| 90-degree rotation | 38/48 | 70.83% |
| Half brightness | 43/48 | 85.42% |
| Central crop | 42/48 | 85.42% |
| Right-third occlusion | 39/48 | 68.75% |

CLIP is useful for ranking candidates but visually similar objects still score
high. Cosine similarity is not an ownership probability. Raising the cutoff to
0.9 improves precision on the original images to 86.36% but misses 29/48 true
pairs. Do not choose a production cutoff solely from this same small dataset.

## Limits and next improvements

Threshold metrics treat every pair not listed as a true match as negative;
ground_truth.json only explicitly labels 76 pairs. This closed-world assumption
must be verified before treating precision as definitive. Rankings break score
ties by found_item_id. There is no held-out test split and no claim that these
checks cover almost all real-world situations.

Keep manual ownership verification. Next, evaluate semantic/multilingual text
embeddings alongside explicit conflicting attribute checks, then evaluate a
combined text/image ranking on a separate labeled dataset. Add genuinely new
photos of similar objects under different viewpoints/backgrounds, plus examples
where no correct found candidate exists. Do not tune and report performance on
the same examples.

The scoring code and UI thresholds were left unchanged by this audit. One
existing functional test was corrected: date scoring is directional (lost then
found), not symmetric.
