"""Experimental rank fusion: text eligibility first, then 75% text / 25% image ranks.

Reciprocal rank fusion avoids averaging incompatible raw score scales. Weights
and rank constant are heuristic, not calibrated probabilities or held-out tuning.
"""
import math
from collections import defaultdict

TEXT_WEIGHT = .75
RANK_CONSTANT = 60


def dense_ranks(values):
    order = {value: rank for rank, value in enumerate(sorted(set(values.values()), reverse=True), 1)}
    return {key: order[value] for key, value in values.items()}


def combine_rankings(rows, images, min_score=70):
    groups = defaultdict(list)
    for row in rows:
        if row['score'] >= min_score and not row.get('conflicts'):
            groups[row['lost_item_id']].append(row)
    output = []
    for lost_id, candidates in groups.items():
        text = dense_ranks({r['found_item_id']: r['score'] for r in candidates})
        available = {}
        for row in candidates:
            key = row['found_item_id']
            value = images.get((lost_id, key))
            if isinstance(value, (int, float)) and math.isfinite(value) and -1 <= value <= 1:
                available[key] = value
        visual = dense_ranks(available)
        for row in candidates:
            key = row['found_item_id']
            # Missing visual evidence retains the text rank, rather than a zero-image penalty.
            image_rank = visual.get(key, text[key])
            fused = TEXT_WEIGHT / (RANK_CONSTANT + text[key]) + (1-TEXT_WEIGHT) / (RANK_CONSTANT + image_rank)
            output.append(dict(row, textScore=row['score'], imageSimilarity=available.get(key),
                rankingScore=round(100*(RANK_CONSTANT+1)*fused, 6),
                evidence='text+image' if key in available else 'text-only'))
    return sorted(output, key=lambda r: (-r['rankingScore'], -r['score'], r['lost_item_id'], r['found_item_id']))
