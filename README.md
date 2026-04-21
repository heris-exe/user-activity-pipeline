# user-activity-pipeline

A **Q2 Week 1** learning project that ties **NumPy** to **real data architecture**: the same vectorized operations you use in notebooks are the compute primitives behind ETL, feature matrices, and scoring layers in production systems.

## What this is about

**Technical thread:** Arrays as first-class units—creation, slicing, masking, axis-wise stats, matrix multiply (`@` / `matmul`), broadcasting, and the memory model (fixed dtypes, contiguous layout) that makes batch operations fast.

**Systems thread:** Data as a flow, not a file—OLTP vs OLAP, ETL, system of record vs derived data, reverse-ETL back into product surfaces, and how roles (backend, data, analytics) map to those boundaries.

The planned centerpiece is a **Jupyter notebook** that walks a synthetic **user event** export from “operational export” → **feature engineering** (pure NumPy) → **aggregations** → **per-user engagement scores** via matrix multiplication → **product-facing output**, with narrative that names what would replace each step at scale (SQL exports, warehouses, reverse-ETL tools, and so on).

## Repository contents

| Item | Description |
|------|-------------|
| `week1-concept-inventory-and-build-plan.md` | Concept inventory, reflections, module-by-module notebook plan, definition of done, and concept-to-build mapping |
| `user_events.csv` | Synthetic user-level events (stand-in for a PostgreSQL-style export) used by the notebook workflow |

The notebook described in the build plan is **not required to exist yet** in this repo; when added, it should run top-to-bottom with **NumPy only** (no Pandas/sklearn in the core path unless you choose an optional stretch).

## Running the notebook (when present)

```text
pip install numpy jupyter
jupyter notebook
```

Open the pipeline notebook and run all cells.

## Why the name

**user-activity-pipeline** names the story: raw user activity from an operational source, transformed into analytics-ready features and scores—the same pattern common in data and ML engineering work, practiced here with explicit NumPy and explicit systems vocabulary.
