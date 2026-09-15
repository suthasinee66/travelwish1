import json
import os
import csv
from collections import defaultdict

import numpy as np

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm


# ============================================================
# CONFIG
# ============================================================

INPUT_FILE = "comparison/comparisonResults.json"
OUTPUT_DIR = "comparison/charts"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# FINAL TDMC CONFIGURATION
# ============================================================

FINAL_EXPERIMENT = "Distance Emphasis"

FINAL_ALPHA = 0.2
FINAL_BETA = 0.3
FINAL_GAMMA = 0.5


# ============================================================
# COLORS
# ============================================================

OLD_COLOR = "#8C8C8C"
TDMC_COLOR = "#1F77B4"

GREEN = "#59A14F"
RED = "#E15759"

LIGHT_GRID = "#DDDDDD"


# ============================================================
# THAI FONT
# ============================================================

available_fonts = {
    font.name
    for font in fm.fontManager.ttflist
}

thai_fonts = [
    "Tahoma",
    "Noto Sans Thai",
    "Noto Sans Thai Looped",
    "Leelawadee UI",
    "Arial Unicode MS",
    "DejaVu Sans",
]

selected_font = "DejaVu Sans"

for font in thai_fonts:
    if font in available_fonts:
        selected_font = font
        break

plt.rcParams["font.family"] = selected_font
plt.rcParams["axes.unicode_minus"] = False

print(f"Using font: {selected_font}")


# ============================================================
# METRICS
# ============================================================

METRICS = [
    "precision",
    "recall",
    "f1",
    "ndcg",
    "averageRating",
    "diversity",
    "avgDistance",
    "runtime",
]


METRIC_LABELS = {
    "precision": "Precision",
    "recall": "Recall",
    "f1": "F1",
    "ndcg": "NDCG@K",
    "averageRating": "Average Rating",
    "diversity": "Diversity",
    "avgDistance": "Average Distance",
    "runtime": "Runtime",
}


METRIC_UNITS = {
    "precision": "",
    "recall": "",
    "f1": "",
    "ndcg": "",
    "averageRating": "",
    "diversity": "",
    "avgDistance": "km",
    "runtime": "ms",
}


# ============================================================
# LOWER IS BETTER
# ============================================================

LOWER_IS_BETTER = {
    "avgDistance",
    "runtime",
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def get_experiment_name(row):
    experiment = row.get("experiment", {})
    tdmc = row.get("tdmc", {})

    return (
        experiment.get("name")
        or tdmc.get("experimentName")
        or "Unknown"
    )


def get_alpha(row):
    experiment = row.get("experiment", {})
    tdmc = row.get("tdmc", {})

    return safe_float(
        experiment.get(
            "alpha",
            tdmc.get("alpha", 0)
        )
    )


def get_beta(row):
    experiment = row.get("experiment", {})
    tdmc = row.get("tdmc", {})

    return safe_float(
        experiment.get(
            "beta",
            tdmc.get("beta", 0)
        )
    )


def get_gamma(row):
    experiment = row.get("experiment", {})
    tdmc = row.get("tdmc", {})

    return safe_float(
        experiment.get(
            "gamma",
            tdmc.get("gamma", 0)
        )
    )


def get_metric(row, algorithm, metric):
    return safe_float(
        row.get(algorithm, {})
        .get("metrics", {})
        .get(metric, 0)
    )


def get_runtime(row, algorithm):
    return safe_float(
        row.get(algorithm, {})
        .get("runtime", 0)
    )


def average(values):
    if not values:
        return 0.0

    return sum(values) / len(values)


def get_case_average(rows, algorithm, metric):

    values = []

    for row in rows:

        if metric == "runtime":
            value = get_runtime(
                row,
                algorithm
            )
        else:
            value = get_metric(
                row,
                algorithm,
                metric
            )

        values.append(value)

    return average(values)


def improvement(old, tdmc, metric):

    if metric in LOWER_IS_BETTER:

        # Lower is better
        return old - tdmc

    # Higher is better
    return tdmc - old


def improvement_percent(old, tdmc, metric):

    if old == 0:
        return 0.0

    if metric in LOWER_IS_BETTER:

        return ((old - tdmc) / old) * 100

    return ((tdmc - old) / old) * 100


def save_chart(filename):

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    plt.tight_layout()

    plt.savefig(
        path,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Saved: {path}")


def add_value_labels(
    bars,
    decimals=3,
    suffix=""
):

    for bar in bars:

        height = bar.get_height()

        plt.text(
            bar.get_x()
            + bar.get_width() / 2,

            height,

            f"{height:.{decimals}f}{suffix}",

            ha="center",
            va="bottom",

            fontsize=8
        )


# ============================================================
# LOAD JSON
# ============================================================

print("\nLoading comparison results...")

with open(
    INPUT_FILE,
    "r",
    encoding="utf-8"
) as f:

    data = json.load(f)


# ============================================================
# NORMALIZE JSON
# ============================================================

if isinstance(data, dict):

    if "results" in data:
        rows = data["results"]

    elif "data" in data:
        rows = data["data"]

    else:
        rows = []

        for value in data.values():

            if isinstance(value, list):
                rows.extend(value)

else:

    rows = data


print(
    f"Total rows in JSON: {len(rows)}"
)


# ============================================================
# DEBUG: AVAILABLE EXPERIMENTS
# ============================================================

print("\nAvailable experiments:")

experiment_counter = defaultdict(int)

for row in rows:

    name = get_experiment_name(row)

    experiment_counter[name] += 1

for name, count in experiment_counter.items():

    print(
        f"  {name}: {count} rows"
    )


# ============================================================
# FILTER FINAL TDMC CONFIG
# ============================================================

final_rows = []

for row in rows:

    experiment_name = get_experiment_name(row)

    alpha = get_alpha(row)
    beta = get_beta(row)
    gamma = get_gamma(row)

    if (
        experiment_name == FINAL_EXPERIMENT
        and abs(alpha - FINAL_ALPHA) < 0.0001
        and abs(beta - FINAL_BETA) < 0.0001
        and abs(gamma - FINAL_GAMMA) < 0.0001
    ):

        final_rows.append(row)


print(
    f"\nFinal configuration: "
    f"{FINAL_EXPERIMENT}"
)

print(
    f"α={FINAL_ALPHA}, "
    f"β={FINAL_BETA}, "
    f"γ={FINAL_GAMMA}"
)

print(
    f"Rows: {len(final_rows)}"
)


if not final_rows:

    raise ValueError(
        "ไม่พบข้อมูล Distance Emphasis "
        "ที่มี α=0.2, β=0.3, γ=0.5"
    )


# ============================================================
# PROVINCES / K
# ============================================================

provinces = sorted(
    set(
        row.get(
            "province",
            "Unknown"
        )
        for row in final_rows
    )
)

ks = sorted(
    set(
        row.get(
            "k",
            0
        )
        for row in final_rows
    )
)


grouped = defaultdict(list)

for row in final_rows:

    key = (
        row.get(
            "province",
            "Unknown"
        ),

        row.get(
            "k",
            0
        )
    )

    grouped[key].append(row)


cases = sorted(
    grouped.keys()
)


print("\nProvinces:")

for province in provinces:
    print(
        f"  - {province}"
    )


print("\nK values:")

for k in ks:
    print(
        f"  - K={k}"
    )


print(
    f"\nTotal cases: {len(cases)}"
)


# ============================================================
# BUILD CASE RESULTS
# ============================================================

case_results = []

for province, k in cases:

    rows_case = grouped[
        (province, k)
    ]

    result = {
        "province": province,
        "k": k,
    }

    for metric in METRICS:

        old_value = get_case_average(
            rows_case,
            "old",
            metric
        )

        tdmc_value = get_case_average(
            rows_case,
            "tdmc",
            metric
        )

        result[
            f"old_{metric}"
        ] = old_value

        result[
            f"tdmc_{metric}"
        ] = tdmc_value

        result[
            f"improvement_{metric}"
        ] = improvement(
            old_value,
            tdmc_value,
            metric
        )

        result[
            f"improvement_pct_{metric}"
        ] = improvement_percent(
            old_value,
            tdmc_value,
            metric
        )

    case_results.append(result)


# ============================================================
# OVERALL RESULTS
# ============================================================

overall = {}

for metric in METRICS:

    old_values = [
        r[f"old_{metric}"]
        for r in case_results
    ]

    tdmc_values = [
        r[f"tdmc_{metric}"]
        for r in case_results
    ]

    old_avg = average(
        old_values
    )

    tdmc_avg = average(
        tdmc_values
    )

    overall[metric] = {

        "old": old_avg,

        "tdmc": tdmc_avg,

        "improvement":
            improvement(
                old_avg,
                tdmc_avg,
                metric
            ),

        "improvement_pct":
            improvement_percent(
                old_avg,
                tdmc_avg,
                metric
            ),
    }


# ============================================================
# PRINT OVERALL
# ============================================================

print("\n========================================")
print("OVERALL RESULTS")
print("========================================")

for metric in METRICS:

    result = overall[metric]

    print(
        f"{METRIC_LABELS[metric]:20s} "
        f"OLD={result['old']:.4f} "
        f"TDMC={result['tdmc']:.4f} "
        f"Δ={result['improvement']:+.4f} "
        f"Δ%={result['improvement_pct']:+.2f}%"
    )


# ============================================================
# CSV 1: BY CASE
# ============================================================

case_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "old_vs_tdmc_distance_emphasis_by_case.csv"
)

case_csv = os.path.normpath(
    case_csv
)


fieldnames = [
    "province",
    "k",
]

for metric in METRICS:

    fieldnames.extend([
        f"old_{metric}",
        f"tdmc_{metric}",
        f"improvement_{metric}",
        f"improvement_pct_{metric}",
    ])


with open(
    case_csv,
    "w",
    newline="",
    encoding="utf-8-sig"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames
    )

    writer.writeheader()

    writer.writerows(
        case_results
    )


print(
    f"\nSaved CSV: {case_csv}"
)


# ============================================================
# CSV 2: OVERALL
# ============================================================

overall_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "old_vs_tdmc_distance_emphasis_overall.csv"
)

overall_csv = os.path.normpath(
    overall_csv
)


overall_rows = []

for metric in METRICS:

    result = overall[metric]

    overall_rows.append({

        "metric":
            metric,

        "metric_label":
            METRIC_LABELS[metric],

        "old":
            result["old"],

        "tdmc":
            result["tdmc"],

        "improvement":
            result["improvement"],

        "improvement_pct":
            result["improvement_pct"],
    })


with open(
    overall_csv,
    "w",
    newline="",
    encoding="utf-8-sig"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "metric",
            "metric_label",
            "old",
            "tdmc",
            "improvement",
            "improvement_pct",
        ]
    )

    writer.writeheader()

    writer.writerows(
        overall_rows
    )


print(
    f"Saved CSV: {overall_csv}"
)


# ============================================================
# CHART 01–08
# GROUPED BAR: OLD VS TDMC
# ============================================================

for chart_index, metric in enumerate(
    METRICS,
    start=1
):

    labels = [
        f"{province}\nK={k}"
        for province, k in cases
    ]

    old_values = [
        r[f"old_{metric}"]
        for r in case_results
    ]

    tdmc_values = [
        r[f"tdmc_{metric}"]
        for r in case_results
    ]

    x = np.arange(
        len(labels)
    )

    width = 0.36

    plt.figure(
        figsize=(14, 7)
    )

    bars_old = plt.bar(
        x - width / 2,
        old_values,
        width,
        label="OLD",
        color=OLD_COLOR
    )

    bars_tdmc = plt.bar(
        x + width / 2,
        tdmc_values,
        width,
        label="TDMC",
        color=TDMC_COLOR
    )

    plt.xticks(
        x,
        labels,
        rotation=0
    )

    plt.ylabel(
        f"{METRIC_LABELS[metric]}"
    )

    plt.xlabel(
        "Province / K"
    )

    plt.title(
        f"OLD vs TDMC — {METRIC_LABELS[metric]}"
    )

    plt.legend()

    plt.grid(
        axis="y",
        linestyle="--",
        alpha=0.3
    )

    # Value labels
    for bars in [
        bars_old,
        bars_tdmc
    ]:

        for bar in bars:

            height = bar.get_height()

            plt.text(
                bar.get_x()
                + bar.get_width() / 2,

                height,

                f"{height:.3f}",

                ha="center",
                va="bottom",

                fontsize=7
            )

    save_chart(
        f"{chart_index:02d}_old_vs_tdmc_{metric}.png"
    )
# ============================================================
# CHART 09
# ACADEMIC LINE CHART — K=1 TO K=10
# BASELINE VS TDMC
# ============================================================

performance_metrics = [
    "precision",
    "recall",
    "f1",
    "diversity",
]

performance_labels = [
    "Precision",
    "Recall",
    "F1",
    "Diversity",
]

# Y-axis range for each metric
y_axis_ranges = {
    "precision": (0.0, 1.0),
    "recall": (0.0, 0.2),
    "f1": (0.0, 0.3),
    "diversity": (0.0, 0.3),
}

k_values = list(range(1, 11))

# ============================================================
# EXPORT CHART 09 DATA TO CSV
# ============================================================

import pandas as pd

chart09_csv_rows = []

for metric, metric_label in zip(
    performance_metrics,
    performance_labels
):

    for k in k_values:

        k_cases = [
            result
            for result in case_results
            if result["k"] == k
        ]

        if not k_cases:
            continue

        baseline_avg = average([
            result[f"old_{metric}"]
            for result in k_cases
        ])

        tdmc_avg = average([
            result[f"tdmc_{metric}"]
            for result in k_cases
        ])

        chart09_csv_rows.append({
            "Metric": metric_label,
            "K": k,
            "Baseline": baseline_avg,
            "TDMC": tdmc_avg
        })


# ------------------------------------------------------------
# Create DataFrame
# ------------------------------------------------------------

chart09_df = pd.DataFrame(
    chart09_csv_rows
)


# ------------------------------------------------------------
# Save CSV
# ------------------------------------------------------------

chart09_csv_path = os.path.join(
    OUTPUT_DIR,
    "09_baseline_vs_tdmc_k1_k10.csv"
)

chart09_df.to_csv(
    chart09_csv_path,
    index=False,
    encoding="utf-8-sig"
)

print(
    f"📄 Saved Chart 09 CSV: {chart09_csv_path}"
)
fig, axes = plt.subplots(
    2,
    2,
    figsize=(15, 10),
    sharex=True,
    sharey=False
)

axes = axes.flatten()

for ax, metric, metric_label in zip(
    axes,
    performance_metrics,
    performance_labels
):

    baseline_values = []
    tdmc_values = []
    actual_k_values = []

    # --------------------------------------------------------
    # Calculate average values for each K
    # --------------------------------------------------------

    for k in k_values:

        k_cases = [
            result
            for result in case_results
            if result["k"] == k
        ]

        if not k_cases:
            continue

        baseline_avg = average([
            result[f"old_{metric}"]
            for result in k_cases
        ])

        tdmc_avg = average([
            result[f"tdmc_{metric}"]
            for result in k_cases
        ])

        actual_k_values.append(k)
        baseline_values.append(baseline_avg)
        tdmc_values.append(tdmc_avg)

    # --------------------------------------------------------
    # BASELINE
    # --------------------------------------------------------

    ax.plot(
        actual_k_values,
        baseline_values,
        marker="o",
        markersize=5.5,
        linewidth=2.4,
        color=OLD_COLOR,
        markeredgewidth=1.2,
        markeredgecolor="white",
        label="Baseline",
        zorder=3
    )

    # --------------------------------------------------------
    # TDMC
    # --------------------------------------------------------

    ax.plot(
        actual_k_values,
        tdmc_values,
        marker="o",
        markersize=5.5,
        linewidth=2.4,
        color=TDMC_COLOR,
        markeredgewidth=1.2,
        markeredgecolor="white",
        label="TDMC",
        zorder=4
    )

    # --------------------------------------------------------
    # Highlight selected K values
    # --------------------------------------------------------

    highlight_k = {1, 5, 10}

    for x_value, value in zip(
        actual_k_values,
        baseline_values
    ):

        if x_value not in highlight_k:
            continue

        ax.annotate(
            f"{value:.3f}",
            xy=(x_value, value),
            xytext=(0, 10),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=7.5,
            color=OLD_COLOR,
            fontweight="bold"
        )

    for x_value, value in zip(
        actual_k_values,
        tdmc_values
    ):

        if x_value not in highlight_k:
            continue

        ax.annotate(
            f"{value:.3f}",
            xy=(x_value, value),
            xytext=(0, -14),
            textcoords="offset points",
            ha="center",
            va="top",
            fontsize=7.5,
            color=TDMC_COLOR,
            fontweight="bold"
        )

    # --------------------------------------------------------
    # Title
    # --------------------------------------------------------

    ax.set_title(
        metric_label,
        fontsize=14,
        fontweight="bold",
        pad=12
    )

    # --------------------------------------------------------
    # Axis labels
    # --------------------------------------------------------

    ax.set_xlabel(
        "Recommendation List Size (K)",
        fontsize=10
    )

    ax.set_ylabel(
        "Score",
        fontsize=10
    )

    # --------------------------------------------------------
    # X-axis
    # --------------------------------------------------------

    ax.set_xticks(range(1, 11))
    ax.set_xlim(0.7, 10.3)

    # --------------------------------------------------------
    # Y-axis — INDIVIDUAL RANGE
    # --------------------------------------------------------

    y_min, y_max = y_axis_ranges[metric]

    ax.set_ylim(
        y_min,
        y_max
    )

    # กำหนด tick ให้เหมาะกับแต่ละ metric
    if metric == "precision":
        ax.set_yticks(
            np.arange(0.0, 1.01, 0.1)
        )

    elif metric == "recall":
        ax.set_yticks(
            np.arange(0.0, 0.201, 0.02)
        )

    elif metric in ["f1", "diversity"]:
        ax.set_yticks(
            np.arange(0.0, 0.301, 0.05)
        )

    # --------------------------------------------------------
    # Grid
    # --------------------------------------------------------

    ax.grid(
        True,
        axis="both",
        linestyle="--",
        linewidth=0.7,
        alpha=0.25,
        zorder=0
    )

    # --------------------------------------------------------
    # Remove top/right borders
    # --------------------------------------------------------

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    ax.tick_params(
        axis="both",
        labelsize=9
    )


# ============================================================
# GLOBAL LEGEND
# ============================================================

handles, labels = axes[0].get_legend_handles_labels()

fig.legend(
    handles,
    labels,
    loc="upper center",
    ncol=2,
    bbox_to_anchor=(0.5, 0.985),
    frameon=False,
    fontsize=11
)


# ============================================================
# MAIN TITLE
# ============================================================

fig.suptitle(
    "Baseline vs TDMC-APD Performance Across Recommendation List Sizes",
    fontsize=17,
    fontweight="bold",
    y=1.025
)

fig.text(
    0.5,
    0.995,
    "Average performance across all evaluated provinces",
    ha="center",
    va="top",
    fontsize=10
)


# ============================================================
# LAYOUT
# ============================================================

plt.tight_layout(
    rect=[
        0,
        0,
        1,
        0.94
    ]
)


# ============================================================
# SAVE
# ============================================================

save_chart(
    "09_baseline_vs_tdmc_k1_k10_line.png"
)

# ============================================================
# CHART 10
# DOT PLOT — AVERAGE RATING
# ============================================================

old_rating = overall[
    "averageRating"
]["old"]

tdmc_rating = overall[
    "averageRating"
]["tdmc"]


plt.figure(
    figsize=(10, 5)
)

y_positions = [0, 1]

values = [
    old_rating,
    tdmc_rating
]

labels = [
    "OLD",
    "TDMC"
]

colors = [
    OLD_COLOR,
    TDMC_COLOR
]

for y_pos, value, label, color in zip(
    y_positions,
    values,
    labels,
    colors
):

    plt.scatter(
        value,
        y_pos,
        s=180,
        color=color,
        zorder=3
    )

    plt.text(
        value + 0.02,
        y_pos,
        f"{value:.3f}",
        va="center",
        fontsize=11
    )


plt.yticks(
    y_positions,
    labels
)

plt.xlabel(
    "Average Rating"
)

plt.title(
    "Average Rating — OLD vs TDMC"
)

plt.xlim(
    0,
    5.5
)

plt.grid(
    axis="x",
    linestyle="--",
    alpha=0.3
)

save_chart(
    "10_average_rating_dot_plot.png"
)


# ============================================================
# CHART 11
# LOLLIPOP — AVERAGE DISTANCE
# ============================================================

old_distance = overall[
    "avgDistance"
]["old"]

tdmc_distance = overall[
    "avgDistance"
]["tdmc"]


plt.figure(
    figsize=(9, 5)
)

x_positions = np.arange(2)

values = [
    old_distance,
    tdmc_distance
]

labels = [
    "OLD",
    "TDMC"
]

colors = [
    OLD_COLOR,
    TDMC_COLOR
]

for x_pos, value, label, color in zip(
    x_positions,
    values,
    labels,
    colors
):

    plt.plot(
        [x_pos, x_pos],
        [0, value],
        color=color,
        linewidth=2
    )

    plt.scatter(
        x_pos,
        value,
        s=180,
        color=color,
        zorder=3
    )

    plt.text(
        x_pos,
        value,
        f"{value:.2f} km",
        ha="center",
        va="bottom",
        fontsize=10
    )


plt.xticks(
    x_positions,
    labels
)

plt.ylabel(
    "Average Distance (km)"
)

plt.title(
    "Average Distance — OLD vs TDMC"
)

plt.grid(
    axis="y",
    linestyle="--",
    alpha=0.3
)

save_chart(
    "11_average_distance_lollipop.png"
)


# ============================================================
# CHART 12
# RUNTIME BAR
# ============================================================

old_runtime = overall[
    "runtime"
]["old"]

tdmc_runtime = overall[
    "runtime"
]["tdmc"]


labels = [
    "OLD",
    "TDMC"
]

values = [
    old_runtime,
    tdmc_runtime
]

plt.figure(
    figsize=(8, 6)
)

bars = plt.bar(
    labels,
    values,
    color=[
        OLD_COLOR,
        TDMC_COLOR
    ],
    width=0.55
)

plt.ylabel(
    "Runtime (ms)"
)

plt.title(
    "Runtime — OLD vs TDMC"
)

plt.grid(
    axis="y",
    linestyle="--",
    alpha=0.3
)

for bar in bars:

    height = bar.get_height()

    plt.text(
        bar.get_x()
        + bar.get_width() / 2,

        height,

        f"{height:.2f} ms",

        ha="center",
        va="bottom",

        fontsize=10
    )


save_chart(
    "12_runtime_old_vs_tdmc.png"
)


# ============================================================
# CHART 13
# DIVERGING BAR — IMPROVEMENT %
# ============================================================

improvement_metrics = [
    "precision",
    "recall",
    "f1",
    "ndcg",
    "averageRating",
    "diversity",
    "avgDistance",
    "runtime",
]

labels = [
    METRIC_LABELS[m]
    for m in improvement_metrics
]

values = [
    overall[m]["improvement_pct"]
    for m in improvement_metrics
]

bar_colors = [
    GREEN if value >= 0 else RED
    for value in values
]


plt.figure(
    figsize=(11, 7)
)

y = np.arange(
    len(labels)
)

bars = plt.barh(
    y,
    values,
    color=bar_colors
)

plt.axvline(
    0,
    linewidth=1
)

plt.yticks(
    y,
    labels
)

plt.xlabel(
    "Improvement (%)"
)

plt.ylabel(
    "Metric"
)

plt.title(
    "TDMC Improvement over OLD"
)

plt.grid(
    axis="x",
    linestyle="--",
    alpha=0.3
)

for bar, value in zip(
    bars,
    values
):

    if value >= 0:

        ha = "left"

        x_text = value + 0.5

    else:

        ha = "right"

        x_text = value - 0.5

    plt.text(
        x_text,
        bar.get_y()
        + bar.get_height() / 2,

        f"{value:+.2f}%",

        va="center",
        ha=ha,

        fontsize=9
    )


save_chart(
    "13_tdmc_improvement_diverging_bar.png"
)


# ============================================================
# CHART 14
# F1 IMPROVEMENT BY PROVINCE
# ============================================================

province_results = defaultdict(list)

for result in case_results:

    province_results[
        result["province"]
    ].append(result)


province_labels = []
province_values = []

for province in sorted(
    province_results.keys()
):

    values = [
        r["improvement_pct_f1"]
        for r in province_results[province]
    ]

    province_labels.append(
        province
    )

    province_values.append(
        average(values)
    )


plt.figure(
    figsize=(11, 6)
)

colors = [
    GREEN if value >= 0 else RED
    for value in province_values
]

bars = plt.bar(
    province_labels,
    province_values,
    color=colors
)

plt.axhline(
    0,
    linewidth=1
)

plt.ylabel(
    "F1 Improvement (%)"
)

plt.xlabel(
    "Province"
)

plt.title(
    "F1 Improvement by Province"
)

plt.grid(
    axis="y",
    linestyle="--",
    alpha=0.3
)

plt.xticks(
    rotation=30,
    ha="right"
)

for bar, value in zip(
    bars,
    province_values
):

    y_pos = (
        value + 0.5
        if value >= 0
        else value - 0.5
    )

    plt.text(
        bar.get_x()
        + bar.get_width() / 2,

        y_pos,

        f"{value:+.2f}%",

        ha="center",

        va=(
            "bottom"
            if value >= 0
            else "top"
        ),

        fontsize=9
    )


save_chart(
    "14_f1_improvement_by_province.png"
)


# ============================================================
# CHART 15
# SCATTER — PRECISION VS RECALL
# ============================================================

plt.figure(
    figsize=(9, 7)
)

for result in case_results:

    plt.scatter(
        result["old_precision"],
        result["old_recall"],
        color=OLD_COLOR,
        s=80,
        alpha=0.8,
        marker="o"
    )

    plt.scatter(
        result["tdmc_precision"],
        result["tdmc_recall"],
        color=TDMC_COLOR,
        s=80,
        alpha=0.8,
        marker="^"
    )


# Legend manually
plt.scatter(
    [],
    [],
    color=OLD_COLOR,
    s=80,
    marker="o",
    label="OLD"
)

plt.scatter(
    [],
    [],
    color=TDMC_COLOR,
    s=80,
    marker="^",
    label="TDMC"
)

plt.xlabel(
    "Precision"
)

plt.ylabel(
    "Recall"
)

plt.title(
    "Precision vs Recall"
)

plt.xlim(
    0,
    1
)

plt.ylim(
    0,
    1
)

plt.legend()

plt.grid(
    linestyle="--",
    alpha=0.3
)

save_chart(
    "15_precision_vs_recall_scatter.png"
)


# ============================================================
# CHART 16
# SCATTER — F1 VS DIVERSITY
# ============================================================

plt.figure(
    figsize=(9, 7)
)

for result in case_results:

    plt.scatter(
        result["old_f1"],
        result["old_diversity"],
        color=OLD_COLOR,
        s=80,
        alpha=0.8,
        marker="o"
    )

    plt.scatter(
        result["tdmc_f1"],
        result["tdmc_diversity"],
        color=TDMC_COLOR,
        s=80,
        alpha=0.8,
        marker="^"
    )


plt.scatter(
    [],
    [],
    color=OLD_COLOR,
    s=80,
    marker="o",
    label="OLD"
)

plt.scatter(
    [],
    [],
    color=TDMC_COLOR,
    s=80,
    marker="^",
    label="TDMC"
)

plt.xlabel(
    "F1"
)

plt.ylabel(
    "Diversity"
)

plt.title(
    "F1 vs Diversity"
)

plt.xlim(
    0,
    1
)

plt.ylim(
    0,
    1
)

plt.legend()

plt.grid(
    linestyle="--",
    alpha=0.3
)

save_chart(
    "16_f1_vs_diversity_scatter.png"
)

# ============================================================
# CSV — CHART 17
# RATING VS DISTANCE SCATTER DATA
# ============================================================

chart17_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "17_rating_vs_distance_scatter.csv"
)

chart17_csv = os.path.normpath(
    chart17_csv
)


chart17_rows = []

for result in case_results:

    chart17_rows.append({
        "Province": result["province"],
        "K": result["k"],

        "Baseline_Average_Distance_km":
            result["old_avgDistance"],

        "Baseline_Average_Rating":
            result["old_averageRating"],

        "TDMC_Average_Distance_km":
            result["tdmc_avgDistance"],

        "TDMC_Average_Rating":
            result["tdmc_averageRating"],
    })


with open(
    chart17_csv,
    "w",
    newline="",
    encoding="utf-8-sig"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "Province",
            "K",
            "Baseline_Average_Distance_km",
            "Baseline_Average_Rating",
            "TDMC_Average_Distance_km",
            "TDMC_Average_Rating",
        ]
    )

    writer.writeheader()

    writer.writerows(
        chart17_rows
    )


print(
    f"Saved Chart 17 CSV: {chart17_csv}"
)


# ============================================================
# CHART 17
# SCATTER — RATING VS DISTANCE
# ============================================================

plt.figure(
    figsize=(9, 7)
)

for result in case_results:

    # --------------------------------------------------------
    # BASELINE
    # --------------------------------------------------------

    plt.scatter(
        result["old_avgDistance"],
        result["old_averageRating"],
        color=OLD_COLOR,
        s=80,
        alpha=0.8,
        marker="o"
    )

    # --------------------------------------------------------
    # TDMC
    # --------------------------------------------------------

    plt.scatter(
        result["tdmc_avgDistance"],
        result["tdmc_averageRating"],
        color=TDMC_COLOR,
        s=80,
        alpha=0.8,
        marker="^"
    )


# ============================================================
# LEGEND
# ============================================================

plt.scatter(
    [],
    [],
    color=OLD_COLOR,
    s=80,
    marker="o",
    label="Baseline"
)

plt.scatter(
    [],
    [],
    color=TDMC_COLOR,
    s=80,
    marker="^",
    label="TDMC-APD"
)


# ============================================================
# AXIS
# ============================================================

plt.xlabel(
    "Average Distance (km)"
)

plt.ylabel(
    "Average Rating"
)

plt.title(
    "Average Rating vs Average Distance"
)

plt.legend()

plt.grid(
    linestyle="--",
    alpha=0.3
)


# ============================================================
# SAVE CHART
# ============================================================

save_chart(
    "17_rating_vs_distance_scatter.png"
)


# ============================================================
# CHART 18
# WEIGHT BAR — α β γ
# ============================================================

weights = [
    FINAL_ALPHA,
    FINAL_BETA,
    FINAL_GAMMA,
]

weight_labels = [
    "α\nAccuracy",
    "β\nPopularity",
    "γ\nDistance",
]


plt.figure(
    figsize=(8, 6)
)

bars = plt.bar(
    weight_labels,
    weights,
    color=[
        "#457B9D",
        "#F4A261",
        TDMC_COLOR
    ],
    width=0.55
)

plt.ylabel(
    "Weight"
)

plt.xlabel(
    "TDMC Component"
)

plt.title(
    "Final TDMC Configuration"
)

plt.ylim(
    0,
    0.6
)

plt.grid(
    axis="y",
    linestyle="--",
    alpha=0.3
)

for bar, value in zip(
    bars,
    weights
):

    plt.text(
        bar.get_x()
        + bar.get_width() / 2,

        value,

        f"{value:.1f}",

        ha="center",
        va="bottom",

        fontsize=11,
        fontweight="bold"
    )


save_chart(
    "18_tdmc_weights_alpha_beta_gamma.png"
)


# ============================================================
# CHART 19
# PERFORMANCE PROFILE
# ============================================================

profile_metrics = [
    "precision",
    "recall",
    "f1",
    "ndcg",
    "diversity",
]

profile_labels = [
    METRIC_LABELS[m]
    for m in profile_metrics
]

old_profile = [
    overall[m]["old"]
    for m in profile_metrics
]

tdmc_profile = [
    overall[m]["tdmc"]
    for m in profile_metrics
]


x = np.arange(
    len(profile_labels)
)


plt.figure(
    figsize=(11, 6)
)

plt.plot(
    x,
    old_profile,
    marker="o",
    linewidth=2,
    markersize=7,
    color=OLD_COLOR,
    label="OLD"
)

plt.plot(
    x,
    tdmc_profile,
    marker="o",
    linewidth=2,
    markersize=7,
    color=TDMC_COLOR,
    label="TDMC"
)


for i, value in enumerate(
    old_profile
):

    plt.text(
        i,
        value + 0.025,

        f"{value:.3f}",

        ha="center",
        fontsize=8,
        color=OLD_COLOR
    )


for i, value in enumerate(
    tdmc_profile
):

    plt.text(
        i,
        value - 0.055,

        f"{value:.3f}",

        ha="center",
        fontsize=8,
        color=TDMC_COLOR
    )


plt.xticks(
    x,
    profile_labels
)

plt.ylabel(
    "Score"
)

plt.xlabel(
    "Evaluation Metric"
)

plt.title(
    "Performance Profile — OLD vs TDMC"
)

plt.ylim(
    0,
    1
)

plt.legend()

plt.grid(
    linestyle="--",
    alpha=0.3
)

save_chart(
    "19_performance_profile.png"
)


# ============================================================
# CHART 20
# HEATMAP — RELATIVE IMPROVEMENT
# ============================================================

heatmap_metrics = [
    "precision",
    "recall",
    "f1",
    "ndcg",
    "averageRating",
    "diversity",
    "avgDistance",
    "runtime",
]

heatmap_labels = [
    METRIC_LABELS[m]
    for m in heatmap_metrics
]


heatmap_values = []

for metric in heatmap_metrics:

    old_value = overall[
        metric
    ]["old"]

    tdmc_value = overall[
        metric
    ]["tdmc"]

    improvement_pct = improvement_percent(
        old_value,
        tdmc_value,
        metric
    )

    heatmap_values.append(
        [0.0, improvement_pct]
    )


heatmap_data = np.array(
    heatmap_values
)


max_abs = np.max(
    np.abs(heatmap_data)
)

if max_abs == 0:
    max_abs = 1


plt.figure(
    figsize=(10, 8)
)

im = plt.imshow(
    heatmap_data,
    cmap="RdYlGn",
    aspect="auto",
    vmin=-max_abs,
    vmax=max_abs
)


plt.xticks(
    [0, 1],
    [
        "OLD",
        "TDMC\nDistance Emphasis"
    ]
)

plt.yticks(
    range(len(heatmap_labels)),
    heatmap_labels
)

plt.xlabel(
    "Algorithm"
)

plt.ylabel(
    "Evaluation Metric"
)

plt.title(
    "OLD vs TDMC — Relative Improvement Heatmap"
)


cbar = plt.colorbar(
    im
)

cbar.set_label(
    "Improvement (%)"
)


# OLD baseline
for i in range(
    len(heatmap_metrics)
):

    plt.text(
        0,
        i,

        "0.00%",

        ha="center",
        va="center",

        color="black",
        fontsize=10
    )


# TDMC improvement
for i in range(
    len(heatmap_metrics)
):

    value = heatmap_data[
        i,
        1
    ]

    plt.text(
        1,
        i,

        f"{value:+.2f}%",

        ha="center",
        va="center",

        color="black",
        fontsize=10,
        fontweight="bold"
    )


plt.tick_params(
    length=0
)

save_chart(
    "20_tdmc_improvement_heatmap.png"
)


# ============================================================
# CSV 3: DETAILED
# ============================================================

detailed_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "old_vs_tdmc_distance_emphasis_detailed.csv"
)

detailed_csv = os.path.normpath(
    detailed_csv
)


detailed_rows = []

for result in case_results:

    row = {
        "province":
            result["province"],

        "k":
            result["k"],
    }

    for metric in METRICS:

        row[
            f"OLD_{metric}"
        ] = result[
            f"old_{metric}"
        ]

        row[
            f"TDMC_{metric}"
        ] = result[
            f"tdmc_{metric}"
        ]

        row[
            f"Improvement_{metric}"
        ] = result[
            f"improvement_{metric}"
        ]

        row[
            f"ImprovementPct_{metric}"
        ] = result[
            f"improvement_pct_{metric}"
        ]

    detailed_rows.append(
        row
    )


if detailed_rows:

    with open(
        detailed_csv,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=detailed_rows[0].keys()
        )

        writer.writeheader()

        writer.writerows(
            detailed_rows
        )


print(
    f"Saved CSV: {detailed_csv}"
)


# ============================================================
# CSV 4: FINAL SUMMARY
# ============================================================

summary_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "FINAL_old_vs_tdmc_distance_emphasis_summary.csv"
)

summary_csv = os.path.normpath(
    summary_csv
)


with open(
    summary_csv,
    "w",
    newline="",
    encoding="utf-8-sig"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "Configuration",
        "Alpha",
        "Beta",
        "Gamma",
        "Metric",
        "OLD",
        "TDMC",
        "Improvement",
        "Improvement (%)",
    ])

    for metric in METRICS:

        result = overall[
            metric
        ]

        writer.writerow([
            FINAL_EXPERIMENT,
            FINAL_ALPHA,
            FINAL_BETA,
            FINAL_GAMMA,
            METRIC_LABELS[metric],
            result["old"],
            result["tdmc"],
            result["improvement"],
            result["improvement_pct"],
        ])


print(
    f"Saved CSV: {summary_csv}"
)


# ============================================================
# CSV 5: IMPROVEMENT SUMMARY
# ============================================================

improvement_csv = os.path.join(
    OUTPUT_DIR,
    "..",
    "FINAL_tdmc_improvement_over_old.csv"
)

improvement_csv = os.path.normpath(
    improvement_csv
)


with open(
    improvement_csv,
    "w",
    newline="",
    encoding="utf-8-sig"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "Metric",
        "OLD",
        "TDMC",
        "Improvement",
        "Improvement (%)",
        "Direction",
    ])

    for metric in METRICS:

        result = overall[
            metric
        ]

        direction = (
            "Higher is better"
            if metric not in LOWER_IS_BETTER
            else "Lower is better"
        )

        writer.writerow([
            METRIC_LABELS[metric],
            result["old"],
            result["tdmc"],
            result["improvement"],
            result["improvement_pct"],
            direction,
        ])


print(
    f"Saved CSV: {improvement_csv}"
)


# ============================================================
# FINISHED
# ============================================================

print("\n========================================")
print("ALL CHARTS GENERATED")
print("========================================")

print(
    f"Output directory: {OUTPUT_DIR}"
)

print(
    "Generated charts: 20"
)

print(
    "Final configuration:"
)

print(
    f"  Experiment = {FINAL_EXPERIMENT}"
)

print(
    f"  α = {FINAL_ALPHA}"
)

print(
    f"  β = {FINAL_BETA}"
)

print(
    f"  γ = {FINAL_GAMMA}"
)

print("\nDone.")