"""Access story for the DATA 150 fall 2026 generative AI survey.

Two checklist-style charts:
1. Four mutually exclusive ways students access tools.
2. Which tools they pay for, and which ones they use through UNC.
"""

import csv
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.transforms import blended_transform_factory

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "as-labels-data150-F26-data-viz-challenge-data.csv"
if not DATA.exists():
    DATA = ROOT / "as-labels-data150-F26-data-viz-challenge-data.csv"
OUT = ROOT / "figures"

PAY = "Self/family-funded version"
UNC = "UNC-provided version"
FREE = "Free version"

NAVY = "#13294B"
BAR = "#D5D5D5"
INK = "#1A1A1A"
MUTED = "#4F4F4F"
SOURCE = "#5E5E5E"

TOOL_NAMES = {
    "Q2.3_1": "ChatGPT",
    "Q2.3_2": "Claude",
    "Q2.3_3": "Copilot",
    "Q2.3_4": "UNC Copilot",
    "Q2.3_5": "DALL-E",
    "Q2.3_6": "DeepSeek",
    "Q2.3_7": "Firefly",
    "Q2.3_8": "Gemini",
    "Q2.3_9": "GLM",
    "Q2.3_10": "Grok",
    "Q2.3_11": "Kimi",
    "Q2.3_12": "Meta AI",
    "Q2.3_13": "Midjourney",
    "Q2.3_14": "Mistral",
    "Q2.3_15": "Perplexity",
    "Q2.3_16": "PromptLab",
    "Q2.3_17": "Other",
}


def load_rows():
    with DATA.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.reader(handle))
    header, data = rows[0], rows[2:]
    index = {name: position for position, name in enumerate(header)}
    return data, index


def cell(row, index, column):
    position = index[column]
    return row[position] if position < len(row) else ""


def version_columns(index):
    return [
        column
        for column in index
        if column.startswith("Q2.3_") and not column.endswith("TEXT")
    ]


def classify(data, index, columns):
    groups = {
        "Paid, no UNC version": [],
        "Paid and UNC version": [],
        "Free only": [],
        "UNC version, no paid plan": [],
    }
    for row in data:
        values = [cell(row, index, column) for column in columns]
        pays = any(value == PAY for value in values)
        unc = any(value == UNC for value in values)
        free = any(value == FREE for value in values)
        if pays and unc:
            groups["Paid and UNC version"].append(row)
        elif pays:
            groups["Paid, no UNC version"].append(row)
        elif unc:
            groups["UNC version, no paid plan"].append(row)
        elif free:
            groups["Free only"].append(row)
        else:
            raise ValueError(f"Unclassified response {cell(row, index, 'ResponseId')}")
    return groups


def tool_counts(data, index, columns):
    counts = {}
    for column in columns:
        values = [cell(row, index, column) for row in data]
        counts[TOOL_NAMES[column]] = {
            "paid": sum(value == PAY for value in values),
            "unc": sum(value == UNC for value in values),
            "free": sum(value == FREE for value in values),
        }
    return counts


def style():
    plt.rcParams.update(
        {
            "font.family": "Segoe UI",
            "font.size": 15,
            "text.color": INK,
            "axes.labelcolor": INK,
            "figure.facecolor": "white",
            "savefig.facecolor": "white",
            "axes.facecolor": "white",
            "axes.unicode_minus": False,
        }
    )


def bare(ax):
    for side in ("top", "right", "left", "bottom"):
        ax.spines[side].set_visible(False)
    ax.tick_params(left=False, bottom=False, labelbottom=False)
    ax.grid(False)
    ax.set_axisbelow(True)


def save(fig, name):
    OUT.mkdir(exist_ok=True)
    png = OUT / f"{name}.png"
    pdf = OUT / f"{name}.pdf"
    fig.savefig(png, dpi=200, bbox_inches="tight", pad_inches=0.35)
    fig.savefig(pdf, bbox_inches="tight", pad_inches=0.35)
    plt.close(fig)
    return png


def chart_groups(groups):
    order = sorted(groups, key=lambda name: len(groups[name]), reverse=True)
    counts = [len(groups[name]) for name in order]
    total = sum(counts)
    percents = [round(count / total * 100) for count in counts]
    if sum(percents) != 100:
        raise ValueError(f"Rounded percents sum to {sum(percents)}")

    fig, ax = plt.subplots(figsize=(12.4, 6.5))
    bare(ax)
    colors = [NAVY if name == "UNC version, no paid plan" else BAR for name in order]
    positions = list(range(len(order)))
    ax.barh(positions, counts, color=colors, height=0.62, zorder=2)
    ax.invert_yaxis()
    ax.set_yticks([])
    ax.set_xlim(0, 28)
    fig.subplots_adjust(left=0.40, right=0.96, top=0.74, bottom=0.16)

    label_transform = blended_transform_factory(fig.transFigure, ax.transData)
    for position, name in enumerate(order):
        ax.text(
            0.06,
            position,
            name,
            transform=label_transform,
            ha="left",
            va="center",
            fontsize=16,
            color=INK,
        )
    for position, count, percent in zip(positions, counts, percents):
        ax.text(
            count + 0.45,
            position,
            f"{count} ({percent}%)",
            va="center",
            ha="left",
            fontsize=16,
            color=INK,
        )

    fig.text(
        0.06,
        0.90,
        "Few students rely on a UNC tool alone",
        ha="left",
        va="bottom",
        fontsize=24,
        color=INK,
        fontweight="semibold",
    )
    fig.text(
        0.06,
        0.835,
        "Each of 46 students is in one group, fall 2026",
        ha="left",
        va="bottom",
        fontsize=16,
        color=MUTED,
    )
    fig.text(
        0.06,
        0.035,
        "Source: DATA 150 fall 2026 generative AI survey.  "
        "Paid means a self- or family-funded version.  "
        "Students who pay may also use free tools.",
        ha="left",
        va="bottom",
        fontsize=12,
        color=SOURCE,
    )
    return save(fig, "01-few-students-rely-on-a-unc-tool-alone")


def chart_tools(counts):
    shown = {
        name: values
        for name, values in counts.items()
        if values["paid"] >= 2 or values["unc"] >= 2
    }
    order = sorted(
        shown,
        key=lambda name: (-shown[name]["paid"], -shown[name]["unc"], name),
    )
    paid = [shown[name]["paid"] for name in order]
    unc = [shown[name]["unc"] for name in order]
    limit = 26

    fig, axes = plt.subplots(1, 2, figsize=(16.2, 8.6), sharey=True)
    panels = (
        (axes[0], paid, {"Claude", "ChatGPT"}),
        (axes[1], unc, {"UNC Copilot", "PromptLab", "Copilot"}),
    )
    for ax, values, highlight in panels:
        bare(ax)
        colors = [NAVY if name in highlight else BAR for name in order]
        positions = list(range(len(order)))
        ax.barh(positions, values, color=colors, height=0.62)
        ax.set_xlim(0, limit)
        ax.set_yticks([])
        for position, value in zip(positions, values):
            ax.text(
                value + 0.35,
                position,
                str(value),
                va="center",
                ha="left",
                fontsize=15,
                color=INK,
            )

    axes[0].invert_yaxis()
    fig.subplots_adjust(left=0.22, right=0.97, top=0.76, bottom=0.18, wspace=0.16)
    fig.canvas.draw()

    label_transform = blended_transform_factory(fig.transFigure, axes[0].transData)
    for position, name in enumerate(order):
        axes[0].text(
            0.04,
            position,
            name,
            transform=label_transform,
            ha="left",
            va="center",
            fontsize=15,
            color=INK,
        )

    right_edge = axes[1].get_position().x0
    headers = (
        (
            0.04,
            "Claude and ChatGPT are what students pay for",
            "Self- or family-funded version, out of 46 students",
        ),
        (
            right_edge,
            "UNC versions cluster on Copilot and PromptLab",
            "UNC-provided version. UNC Copilot is Copilot with Data Protection.",
        ),
    )
    for x, title, subtitle in headers:
        fig.text(x, 0.90, title, ha="left", va="bottom", fontsize=20, color=INK, fontweight="semibold")
        fig.text(x, 0.845, subtitle, ha="left", va="bottom", fontsize=14, color=MUTED)

    fig.text(
        0.04,
        0.035,
        "A student can be counted for more than one tool.  "
        f"Free is still the most common version of ChatGPT ({counts['ChatGPT']['free']}) "
        f"and Gemini ({counts['Gemini']['free']}).\n"
        "Tools with fewer than 2 paid or UNC users are omitted.  "
        "Source: DATA 150 fall 2026 generative AI survey.",
        ha="left",
        va="bottom",
        fontsize=12,
        color=SOURCE,
    )
    return save(fig, "02-where-paid-plans-and-unc-versions-sit")


def main():
    style()
    data, index = load_rows()
    columns = version_columns(index)
    groups = classify(data, index, columns)
    counts = tool_counts(data, index, columns)
    if sum(len(rows) for rows in groups.values()) != len(data):
        raise ValueError("Group counts do not cover every respondent")

    first = chart_groups(groups)
    second = chart_tools(counts)
    print(f"respondents {len(data)}")
    for name, rows in groups.items():
        print(f"{name}: {len(rows)}")
    print(first)
    print(second)


if __name__ == "__main__":
    main()
