# user-activity-pipeline

A Q2 Week 1 learning project that connects **NumPy-first analytics work** to a **production-style software interface**. The repo now has both:

- a notebook that explains the pipeline step by step
- a Next.js dashboard that shows what the same analytics output could look like in a polished product surface

## What this project covers

**Technical thread:** arrays as first-class units - creation, slicing, masking, axis-based stats, matrix multiplication, broadcasting, and the memory model that makes vectorized work fast.

**Systems thread:** data as a flow - OLTP vs OLAP, ETL, system of record vs derived data, reverse ETL, feature engineering, and how backend, data, and analytics roles meet around the same pipeline.

The notebook starts from a synthetic operational export, engineers features with pure NumPy, computes engagement scores, and frames the result in real data architecture language. The dashboard then turns that same output into a recruiter-ready analytics UI.

## Repository contents

| Item | Description |
|------|-------------|
| `user-activity-pipeline.ipynb` | End-to-end notebook covering performance, ETL, feature engineering, aggregation, scoring, broadcasting, and systems framing |
| `user_events.csv` | Synthetic user event export used as the raw source |
| `data/analytics-snapshot.json` | Generated frontend fixture derived from the CSV using the same scoring logic as the notebook |
| `app/`, `components/`, `lib/` | Next.js analytics dashboard app |
| `scripts/generate-analytics-snapshot.ts` | Snapshot generator that converts the CSV into frontend-ready analytics data |
| `tests/` | Snapshot and dashboard utility tests |
| `week1-concept-inventory-and-build-plan.md` | Concept inventory, module plan, and learning notes |

## Running the dashboard

```text
npm install
npm run generate:data
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```text
npm run test
npm run typecheck
npm run lint
npm run build
```

## Running the notebook

```text
pip install numpy jupyter
jupyter notebook
```

Open `user-activity-pipeline.ipynb` and run all cells.

## Why the name

**user-activity-pipeline** names the whole story: raw user activity from an operational source, transformed into analytics-ready features and scores, then surfaced in a product-style interface the way a real data or ML system might expose it.
