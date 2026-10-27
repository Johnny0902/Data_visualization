import os
import sys
import json
import matplotlib
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib'
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Set cohesive modern style
sns.set_theme(style="whitegrid", font="sans-serif")
plt.rcParams['font.size'] = 11
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['figure.dpi'] = 300

# -------------------------------------------------------------
# 1. Load Data
# -------------------------------------------------------------
def load_survey_data():
    candidate_paths = [
        "../data/as-labels-data150-F26-data-viz-challenge-data.csv",
        "data/as-labels-data150-F26-data-viz-challenge-data.csv",
        "as-labels-data150-F26-data-viz-challenge-data.csv"
    ]
    filepath = None
    for p in candidate_paths:
        if os.path.exists(p):
            filepath = p
            break
            
    if not filepath:
        raise FileNotFoundError("Could not find survey CSV file in candidate locations.")
        
    print(f"Loading data from: {filepath}")
    df_raw = pd.read_csv(filepath)
    questions = df_raw.iloc[0]
    data = df_raw.iloc[1:].copy()
    return questions, data

questions, df = load_survey_data()
N = len(df)
print(f"Loaded survey with {N} student responses.")

# Create output folder for figures
output_dir = "figures"
os.makedirs(output_dir, exist_ok=True)

# Carolina Blue & Story Palette
CAROLINA_BLUE = "#4B9CD3"
NAVY_BLUE = "#13294B"
PAID_COLOR = "#D9534F"       # Warm Red/Coral for out-of-pocket spending
FREE_COLOR = "#5BC0BE"       # Teal for free tiers
UNC_COLOR = "#4B9CD3"        # Official Carolina Blue for UNC-provided
INACTIVE_COLOR = "#D3D3D3"   # Muted gray for inactive


# -------------------------------------------------------------
# GRAPH 1: The AI Funding Divide (Stacked Horizontal Bar Chart)
# -------------------------------------------------------------
def plot_funding_divide(df, save_path):
    print("Generating Graph 1: Funding Divide...")
    tools = [
        ("Claude AI (Anthropic)", "Q2.3_2"),
        ("ChatGPT (OpenAI)", "Q2.3_1"),
        ("Copilot with UNC Data Protection", "Q2.3_4"),
        ("Microsoft Copilot (General)", "Q2.3_3"),
        ("Gemini/Bard (Google)", "Q2.3_8"),
        ("DeepSeek", "Q2.3_6")
    ]
    
    rows = []
    for label, col in tools:
        counts = df[col].value_counts()
        paid = counts.get("Self/family-funded version", 0)
        free = counts.get("Free version", 0)
        unc = counts.get("UNC-provided version", 0)
        inactive = counts.get("Not used since start of fall 2026 semester", 0)
        
        unreached = N - (paid + free + unc + inactive)
        inactive += unreached
        
        rows.append({
            "Tool": label,
            "Self/Family Funded ($)": paid,
            "Free Tier": free,
            "UNC-Provided": unc,
            "Inactive / Not Used": inactive
        })
        
    plot_df = pd.DataFrame(rows).set_index("Tool")
    plot_df = plot_df.loc[plot_df["Self/Family Funded ($)"].sort_values(ascending=True).index]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    colors = [PAID_COLOR, FREE_COLOR, UNC_COLOR, INACTIVE_COLOR]
    
    plot_df.plot(
        kind="barh",
        stacked=True,
        ax=ax,
        color=colors,
        edgecolor="white",
        linewidth=1.2,
        width=0.65
    )
    
    ax.set_title("The AI Funding Divide: Who Pays for Student AI?", pad=16)
    ax.set_xlabel("Number of Students (out of 46)", labelpad=10)
    ax.set_ylabel("")
    ax.set_xlim(0, 48)
    
    for i, (tool, row) in enumerate(plot_df.iterrows()):
        paid_val = row["Self/Family Funded ($)"]
        if paid_val > 0:
            ax.text(paid_val / 2, i, f"{int(paid_val)} ({paid_val/N*100:.0f}%)", 
                    va='center', ha='center', color='white', fontweight='bold', fontsize=9.5)
            
        unc_val = row["UNC-Provided"]
        if unc_val > 0:
            unc_start = paid_val + row["Free Tier"]
            ax.text(unc_start + unc_val / 2, i, f"{int(unc_val)}", 
                    va='center', ha='center', color='white', fontweight='bold', fontsize=9.5)
    
    ax.annotate(
        "41% pay out-of-pocket for Claude\nand 37% for ChatGPT Plus,\ndespite UNC providing Copilot free",
        xy=(19, 5), xytext=(27, 4.0),
        arrowprops=dict(facecolor=NAVY_BLUE, shrink=0.08, width=1.5, headwidth=7),
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#FFF2CC", edgecolor="#D6B656", alpha=0.9),
        fontsize=9.5, fontweight='semibold', color=NAVY_BLUE
    )
    
    ax.legend(title="License Type", bbox_to_anchor=(1.02, 1), loc='upper left', frameon=True)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved: {save_path}")


# -------------------------------------------------------------
# GRAPH 2: Familiarity Gap (UNC Official vs Commercial Leaders)
# -------------------------------------------------------------
def plot_familiarity_gap(df, save_path):
    print("Generating Graph 2: Familiarity Gap...")
    tools_fam = [
        ("UNC Copilot (Data Protected)", "Q2.1_4", "UNC Official"),
        ("UNC PromptLab (Library)", "Q2.1_16", "UNC Official"),
        ("ChatGPT (OpenAI)", "Q2.1_1", "Commercial Leader"),
        ("Claude AI (Anthropic)", "Q2.1_2", "Commercial Leader"),
        ("Google Gemini", "Q2.1_8", "Commercial Leader")
    ]
    
    rows = []
    for name, col, group in tools_fam:
        val_counts = df[col].value_counts()
        never_heard = val_counts.get("Never heard of it", 0)
        heard_only = val_counts.get("Have heard of it but never used it", 0)
        experiment = val_counts.get("Have used it to experiment only", 0)
        active_use = val_counts.get("Have used it", 0) + val_counts.get("Have used it frequently", 0)
        
        rows.append({
            "Tool": name,
            "Group": group,
            "Never heard": never_heard / N * 100,
            "Heard only": heard_only / N * 100,
            "Experiment only": experiment / N * 100,
            "Active / Frequent use": active_use / N * 100
        })
        
    fam_df = pd.DataFrame(rows).set_index("Tool")
    fig, ax = plt.subplots(figsize=(11, 5.5))
    fam_colors = ["#E05A47", "#F4A261", "#80B1D3", "#2A9D8F"]
    
    fam_df[["Never heard", "Heard only", "Experiment only", "Active / Frequent use"]].plot(
        kind="barh",
        stacked=True,
        ax=ax,
        color=fam_colors,
        edgecolor="white",
        width=0.6
    )
    
    ax.set_title("The Institutional Awareness Gap: Official UNC Tools vs. Commercial Market", pad=15)
    ax.set_xlabel("% of Respondents (N=46)", labelpad=10)
    ax.set_ylabel("")
    ax.set_xlim(0, 100)
    ax.axvline(50, color='gray', linestyle='--', alpha=0.7)
    ax.text(50.5, 0.2, "50% mark", color='gray', fontsize=9)
    
    ax.annotate(
        "72% unaware or non-users\nof UNC PromptLab",
        xy=(72, 1), xytext=(78, 1.3),
        arrowprops=dict(arrowstyle="->", color=NAVY_BLUE, lw=1.5),
        bbox=dict(boxstyle="round,pad=0.3", facecolor="#F8D7DA", edgecolor="#F5C6CB"),
        fontsize=9, color="#721C24"
    )
    
    ax.legend(
        ["Never heard of it", "Heard but never used", "Experimented only", "Active / Frequent use"],
        title="Familiarity Level",
        bbox_to_anchor=(1.02, 1),
        loc='upper left',
        frameon=True
    )
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved: {save_path}")


# -------------------------------------------------------------
# GRAPH 3: Active Daily Engagement: Institutional Ghost Town
# -------------------------------------------------------------
def plot_frequency_comparison(df, save_path):
    print("Generating Graph 3: Usage Frequency...")
    freq_tools = [
        ("ChatGPT", "Q2.2_1"),
        ("Claude", "Q2.2_2"),
        ("UNC Copilot", "Q2.2_4")
    ]
    
    freq_categories = {
        "Daily / Multiple times a day": ["Daily", "Multiple times a day"],
        "Weekly (1-3x per week)": ["Once or twice per week", "Several times per week"],
        "Monthly (1-3x per month)": ["Once or twice a month", "Several times a month"],
        "Inactive / Never": ["Not used since start of fall 2026 semester", np.nan]
    }
    
    matrix = {}
    for tool_name, col in freq_tools:
        col_series = df[col]
        counts = {}
        for cat_label, match_vals in freq_categories.items():
            if np.nan in match_vals:
                c = col_series.isin([v for v in match_vals if v is not np.nan]).sum() + col_series.isna().sum()
            else:
                c = col_series.isin(match_vals).sum()
            counts[cat_label] = (c / N) * 100
        matrix[tool_name] = counts
        
    freq_df = pd.DataFrame(matrix)
    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(freq_categories))
    width = 0.25
    colors = [CAROLINA_BLUE, "#9370DB", "#FF7F0E"]
    
    for idx, (tool_name, tool_col) in enumerate(freq_tools):
        values = [freq_df.loc[cat, tool_name] for cat in freq_categories.keys()]
        bars = ax.bar(x + idx * width - width, values, width, label=tool_name, color=colors[idx], edgecolor='white')
        for bar in bars:
            height = bar.get_height()
            if height > 4:
                ax.annotate(f'{height:.0f}%',
                            xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 3),
                            textcoords="offset points",
                            ha='center', va='bottom', fontsize=9, fontweight='semibold')
                
    ax.set_title("Frequency Gap: Commercial Regulars vs. UNC Copilot", pad=15)
    ax.set_ylabel("% of Student Cohort", labelpad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(list(freq_categories.keys()), rotation=10, ha='right')
    ax.set_ylim(0, 100)
    ax.legend(title="Tool", frameon=True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved: {save_path}")


# -------------------------------------------------------------
# GRAPH 4: Student Wallet Paradox (Spending vs Free University Tools)
# -------------------------------------------------------------
def plot_wallet_paradox(df, save_path):
    print("Generating Graph 4: Wallet Paradox...")
    lic_cols = [c for c in df.columns if c.startswith('Q2.3_')]
    
    paid_mask = df[lic_cols].isin(['Self/family-funded version']).any(axis=1)
    unc_mask = df[lic_cols].isin(['UNC-provided version']).any(axis=1)
    
    paid_only = (paid_mask & ~unc_mask).sum()
    hybrid = (paid_mask & unc_mask).sum()
    unc_only = (~paid_mask & unc_mask).sum()
    free_only = (~paid_mask & ~unc_mask).sum()
    
    segments = {
        "Pays Out-of-Pocket Only\n(No UNC Tool Used)": paid_only,
        "Hybrid User\n(Pays + Uses UNC Tool)": hybrid,
        "Free Tiers Only\n(No UNC, No Payment)": free_only,
        "UNC Official Only\n(Relies on UNC License)": unc_only
    }
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), gridspec_kw={'width_ratios': [1.2, 1]})
    wedge_colors = [PAID_COLOR, "#E88873", FREE_COLOR, UNC_COLOR]
    wedges, texts, autotexts = ax1.pie(
        segments.values(),
        labels=segments.keys(),
        autopct='%1.1f%%',
        startangle=140,
        colors=wedge_colors,
        pctdistance=0.75,
        wedgeprops=dict(width=0.45, edgecolor='white', linewidth=2)
    )
    plt.setp(autotexts, size=10, weight="bold", color="white")
    ax1.set_title("Student AI Adoption Segments\n(N=46)", pad=10)
    
    claude_paid = (df['Q2.3_2'] == 'Self/family-funded version').sum()
    gpt_paid = (df['Q2.3_1'] == 'Self/family-funded version').sum()
    deepseek_paid = (df['Q2.3_6'] == 'Self/family-funded version').sum()
    
    monthly_rate = 20
    semester_months = 4
    claude_spend = claude_paid * monthly_rate * semester_months
    gpt_spend = gpt_paid * monthly_rate * semester_months
    deepseek_spend = deepseek_paid * 10 * semester_months
    total_spend = claude_spend + gpt_spend + deepseek_spend
    
    spend_df = pd.DataFrame({
        "Tool": ["Claude Pro", "ChatGPT Plus", "Other Paid", "UNC Copilot\n(Campus License)"],
        "Estimated Semester Spend ($)": [claude_spend, gpt_spend, deepseek_spend, 0]
    })
    
    bars = ax2.bar(
        spend_df["Tool"], 
        spend_df["Estimated Semester Spend ($)"],
        color=[PAID_COLOR, "#E88873", "#F4A261", UNC_COLOR],
        edgecolor='white',
        width=0.55
    )
    
    ax2.set_title(f"Estimated Cohort Spend This Semester:\n~${total_spend:,.0f} Out-of-Pocket", pad=10)
    ax2.set_ylabel("Total Spent by Cohort ($)", labelpad=8)
    ax2.set_ylim(0, 1800)
    
    for bar in bars:
        h = bar.get_height()
        if h > 0:
            ax2.text(bar.get_x() + bar.get_width() / 2, h + 30, f"${h:,.0f}", 
                     ha='center', va='bottom', fontweight='bold', fontsize=10)
        else:
            ax2.text(bar.get_x() + bar.get_width() / 2, 30, "$0 (Free)", 
                     ha='center', va='bottom', color=NAVY_BLUE, fontweight='bold', fontsize=10)
            
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved: {save_path}")


# -------------------------------------------------------------
# GRAPH 5: Comprehensive 4-Panel Executive Dashboard
# -------------------------------------------------------------
def plot_executive_dashboard(df, save_path):
    print("Generating Graph 5: Executive 4-Panel Dashboard...")
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    # Panel 1: Funding Divide
    ax1 = axes[0, 0]
    tools = [
        ("Claude AI", "Q2.3_2"),
        ("ChatGPT", "Q2.3_1"),
        ("UNC Copilot", "Q2.3_4"),
        ("MS Copilot", "Q2.3_3"),
        ("Gemini", "Q2.3_8")
    ]
    rows = []
    for label, col in tools:
        counts = df[col].value_counts()
        paid = counts.get("Self/family-funded version", 0)
        free = counts.get("Free version", 0)
        unc = counts.get("UNC-provided version", 0)
        inactive = N - (paid + free + unc)
        rows.append({"Tool": label, "Paid ($)": paid, "Free": free, "UNC": unc, "Inactive": inactive})
    p_df = pd.DataFrame(rows).set_index("Tool").loc[::-1]
    p_df.plot(kind="barh", stacked=True, ax=ax1, color=[PAID_COLOR, FREE_COLOR, UNC_COLOR, INACTIVE_COLOR], edgecolor='white')
    ax1.set_title("A. Access Model by Platform", fontsize=13)
    ax1.set_xlabel("Number of Students", fontsize=10)
    ax1.legend(loc="lower right", frameon=True, fontsize=9)
    
    # Panel 2: Discovery Channels
    ax2 = axes[0, 1]
    disc_map = {
        "Friends": "Q2.4_1",
        "Social Media": "Q2.4_4",
        "Professors": "Q2.4_3",
        "Academic Courses": "Q2.4_5",
        "UNC Workshops": "Q2.4_6",
        "Family": "Q2.4_2"
    }
    disc_counts = {k: (df[v].dropna() != '0').sum() for k, v in disc_map.items()}
    disc_s = pd.Series(disc_counts).sort_values(ascending=True)
    
    colors_disc = [NAVY_BLUE if "UNC" in k or "Prof" in k or "Course" in k else "#F4A261" for k in disc_s.index]
    bars2 = ax2.barh(disc_s.index, disc_s.values, color=colors_disc, edgecolor='white')
    ax2.set_title("B. How Students Learn About AI Tools", fontsize=13)
    ax2.set_xlabel("Number of Students Reporting Source", fontsize=10)
    for bar in bars2:
        w = bar.get_width()
        ax2.text(w + 0.5, bar.get_y() + bar.get_height()/2, f"{int(w)} ({w/N*100:.0f}%)", va='center', fontsize=9)
    ax2.set_xlim(0, 48)
    
    # Panel 3: Adoption Segments
    ax3 = axes[1, 0]
    lic_cols = [c for c in df.columns if c.startswith('Q2.3_')]
    paid_m = df[lic_cols].isin(['Self/family-funded version']).any(axis=1)
    unc_m = df[lic_cols].isin(['UNC-provided version']).any(axis=1)
    segs = {
        "Pays Out-of-Pocket Only": (paid_m & ~unc_m).sum(),
        "Pays + Uses UNC": (paid_m & unc_m).sum(),
        "Free Tiers Only": (~paid_m & ~unc_m).sum(),
        "UNC Provided Only": (~paid_m & unc_m).sum()
    }
    ax3.pie(segs.values(), labels=segs.keys(), autopct='%1.1f%%', startangle=140,
            colors=[PAID_COLOR, "#E88873", FREE_COLOR, UNC_COLOR],
            wedgeprops=dict(width=0.45, edgecolor='white', linewidth=1.5))
    ax3.set_title("C. Student AI Funding Segmentation (N=46)", fontsize=13)
    
    # Panel 4: Active Frequency (Daily/Weekly)
    ax4 = axes[1, 1]
    active_daily = {
        "ChatGPT": df['Q2.2_1'].isin(["Daily", "Multiple times a day"]).sum() / N * 100,
        "Claude": df['Q2.2_2'].isin(["Daily", "Multiple times a day"]).sum() / N * 100,
        "UNC Copilot": df['Q2.2_4'].isin(["Daily", "Multiple times a day"]).sum() / N * 100
    }
    active_s = pd.Series(active_daily)
    bars4 = ax4.bar(active_s.index, active_s.values, color=[CAROLINA_BLUE, "#9370DB", PAID_COLOR], width=0.5, edgecolor='white')
    ax4.set_title("D. % of Cohort Using Platform Daily", fontsize=13)
    ax4.set_ylabel("% Daily or Multiple Times/Day", fontsize=10)
    ax4.set_ylim(0, 60)
    for bar in bars4:
        h = bar.get_height()
        ax4.text(bar.get_x() + bar.get_width()/2, h + 1, f"{h:.1f}%", ha='center', va='bottom', fontweight='bold', fontsize=10)
        
    plt.suptitle("STORY 1: The Campus AI Disconnect (Enterprise vs. Student Reality)", fontsize=16, fontweight='bold', y=0.99)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved: {save_path}")


# -------------------------------------------------------------
# 2. JSON Data Exporter for Frontend (data-viz-challenge)
# -------------------------------------------------------------
def build_survey_payload():
    """Generates the structured JSON payload used by the React interactive frontend."""
    lic_cols = [c for c in df.columns if c.startswith('Q2.3_')]
    paid_mask = df[lic_cols].isin(['Self/family-funded version']).any(axis=1)
    unc_mask = df[lic_cols].isin(['UNC-provided version']).any(axis=1)
    
    # Platforms detailed configuration
    tools_config = [
        {'id': 'claude', 'name': 'Claude AI', 'vendor': 'Anthropic', 'fam_col': 'Q2.1_2', 'freq_col': 'Q2.2_2', 'lic_col': 'Q2.3_2', 'is_unc': False, 'cost_tier': 20},
        {'id': 'chatgpt', 'name': 'ChatGPT', 'vendor': 'OpenAI', 'fam_col': 'Q2.1_1', 'freq_col': 'Q2.2_1', 'lic_col': 'Q2.3_1', 'is_unc': False, 'cost_tier': 20},
        {'id': 'unc_copilot', 'name': 'UNC Protected Copilot', 'vendor': 'UNC / Microsoft', 'fam_col': 'Q2.1_4', 'freq_col': 'Q2.2_4', 'lic_col': 'Q2.3_4', 'is_unc': True, 'cost_tier': 0},
        {'id': 'ms_copilot', 'name': 'Copilot (General)', 'vendor': 'Microsoft', 'fam_col': 'Q2.1_3', 'freq_col': 'Q2.2_3', 'lic_col': 'Q2.3_3', 'is_unc': False, 'cost_tier': 0},
        {'id': 'gemini', 'name': 'Gemini / Google', 'vendor': 'Google', 'fam_col': 'Q2.1_8', 'freq_col': 'Q2.2_8', 'lic_col': 'Q2.3_8', 'is_unc': False, 'cost_tier': 20},
        {'id': 'deepseek', 'name': 'DeepSeek', 'vendor': 'DeepSeek', 'fam_col': 'Q2.1_6', 'freq_col': 'Q2.2_6', 'lic_col': 'Q2.3_6', 'is_unc': False, 'cost_tier': 10},
        {'id': 'promptlab', 'name': 'UNC PromptLab', 'vendor': 'UNC Library', 'fam_col': 'Q2.1_16', 'freq_col': 'Q2.2_16', 'lic_col': 'Q2.3_16', 'is_unc': True, 'cost_tier': 0},
        {'id': 'perplexity', 'name': 'Perplexity AI', 'vendor': 'Perplexity', 'fam_col': 'Q2.1_15', 'freq_col': 'Q2.2_15', 'lic_col': 'Q2.3_15', 'is_unc': False, 'cost_tier': 20},
        {'id': 'meta_ai', 'name': 'Meta AI / Llama', 'vendor': 'Meta', 'fam_col': 'Q2.1_12', 'freq_col': 'Q2.2_12', 'lic_col': 'Q2.3_12', 'is_unc': False, 'cost_tier': 0},
        {'id': 'grok', 'name': 'Grok', 'vendor': 'xAI', 'fam_col': 'Q2.1_10', 'freq_col': 'Q2.2_10', 'lic_col': 'Q2.3_10', 'is_unc': False, 'cost_tier': 16}
    ]
    
    platforms = []
    for t in tools_config:
        lic_counts = df[t['lic_col']].value_counts().to_dict() if t['lic_col'] in df else {}
        paid = lic_counts.get('Self/family-funded version', 0)
        free = lic_counts.get('Free version', 0)
        unc = lic_counts.get('UNC-provided version', 0)
        inactive_lic = lic_counts.get('Not used since start of fall 2026 semester', 0)
        unreached = N - (paid + free + unc + inactive_lic)
        
        fam_counts = df[t['fam_col']].value_counts().to_dict() if t['fam_col'] in df else {}
        never = fam_counts.get('Never heard of it', 0)
        heard = fam_counts.get('Have heard of it but never used it', 0)
        exp = fam_counts.get('Have used it to experiment only', 0)
        active = fam_counts.get('Have used it', 0) + fam_counts.get('Have used it frequently', 0)
        
        freq_series = df[t['freq_col']] if t['freq_col'] in df else pd.Series()
        daily = freq_series.isin(['Daily', 'Multiple times a day']).sum()
        weekly = freq_series.isin(['Once or twice per week', 'Several times per week']).sum()
        monthly = freq_series.isin(['Once or twice a month', 'Several times a month']).sum()
        inactive_freq = N - (daily + weekly + monthly)
        
        platforms.append({
            'id': t['id'],
            'name': t['name'],
            'vendor': t['vendor'],
            'is_unc': t['is_unc'],
            'cost_tier': t['cost_tier'],
            'paid_count': int(paid),
            'free_count': int(free),
            'unc_count': int(unc),
            'inactive_count': int(inactive_lic + unreached),
            'paid_pct': round(paid / N * 100, 1),
            'free_pct': round(free / N * 100, 1),
            'unc_pct': round(unc / N * 100, 1),
            'familiarity': {
                'never_heard': int(never),
                'heard_only': int(heard),
                'experimented': int(exp),
                'active_use': int(active)
            },
            'frequency': {
                'daily': int(daily),
                'weekly': int(weekly),
                'monthly': int(monthly),
                'inactive': int(inactive_freq)
            }
        })
        
    # Cohort Segments
    segments = [
        {"name": "Pays Out-of-Pocket Only", "count": int((paid_mask & ~unc_mask).sum()), "percentage": round((paid_mask & ~unc_mask).sum() / N * 100, 1), "color": PAID_COLOR, "desc": "Subscribes to Claude/ChatGPT Plus while ignoring free UNC licenses."},
        {"name": "Hybrid User", "count": int((paid_mask & unc_mask).sum()), "percentage": round((paid_mask & unc_mask).sum() / N * 100, 1), "color": "#E88873", "desc": "Uses both paid consumer models and UNC enterprise tools."},
        {"name": "Free Tier Only", "count": int((~paid_mask & ~unc_mask).sum()), "percentage": round((~paid_mask & ~unc_mask).sum() / N * 100, 1), "color": FREE_COLOR, "desc": "Relies entirely on free commercial AI tiers (ChatGPT Free, DeepSeek, etc.)."},
        {"name": "UNC Tools Only", "count": int((~paid_mask & unc_mask).sum()), "percentage": round((~paid_mask & unc_mask).sum() / N * 100, 1), "color": UNC_COLOR, "desc": "Only utilizes official UNC provided tools."}
    ]
    
    # Discovery Channels
    disc_map = [
        ("From Friends", "Q2.4_1", "Peer / Organic"),
        ("Social Media", "Q2.4_4", "Peer / Organic"),
        ("Professors & Teachers", "Q2.4_3", "Academic"),
        ("Academic Courses", "Q2.4_5", "Academic"),
        ("UNC Trainings & Workshops", "Q2.4_6", "Institutional"),
        ("Family Members", "Q2.4_2", "Personal")
    ]
    discovery = []
    for label, col, cat in disc_map:
        cnt = (df[col].dropna() != '0').sum()
        discovery.append({
            "channel": label,
            "category": cat,
            "count": int(cnt),
            "percentage": round(cnt / N * 100, 1)
        })
        
    # Top Tasks across cohort
    task_cols = [c for c in df.columns if c.startswith('Q2.6_') and not c.endswith('_TEXT')]
    tasks = []
    for c in task_cols:
        task_name = questions[c].split(' - ')[-1] if c in questions else c
        active = df[c].dropna()
        active = active[~active.isin(['0', 0, '-99', -99])]
        if len(active) > 0 and task_name != "Other, please specify:":
            tasks.append({
                "task": task_name,
                "count": int(len(active)),
                "percentage": round(len(active) / N * 100, 1)
            })
    tasks = sorted(tasks, key=lambda x: x['count'], reverse=True)
    
    # Recent tool usage comparison (Head-to-head)
    recent_counts = df['Q5.2'].value_counts()
    recent_tools = [
        {"tool": "Claude (Anthropic)", "count": int(recent_counts.get("Claude (Anthropic)", 0)), "color": "#9370DB"},
        {"tool": "ChatGPT (OpenAI)", "count": int(recent_counts.get("ChatGPT (OpenAI)", 0)), "color": CAROLINA_BLUE},
        {"tool": "Google Gemini", "count": int(recent_counts.get("Gemini/Bard (Google)", 0)), "color": "#5BC0BE"},
        {"tool": "UNC Copilot", "count": int(recent_counts.get("Copilot with Data Protection (provided by UNC)", 0)), "color": NAVY_BLUE},
        {"tool": "Other Tools", "count": int(sum(recent_counts.get(k, 0) for k in recent_counts.index if k not in ["Claude (Anthropic)", "ChatGPT (OpenAI)", "Gemini/Bard (Google)", "Copilot with Data Protection (provided by UNC)"])), "color": "#A0AEC0"}
    ]
    
    # Financial aggregate summary
    claude_paid = int((df['Q2.3_2'] == 'Self/family-funded version').sum())
    gpt_paid = int((df['Q2.3_1'] == 'Self/family-funded version').sum())
    deepseek_paid = int((df['Q2.3_6'] == 'Self/family-funded version').sum())
    
    return {
        "summary": {
            "total_students": N,
            "paying_students": int(paid_mask.sum()),
            "paying_percentage": round(paid_mask.sum() / N * 100, 1),
            "unc_tool_users": int(unc_mask.sum()),
            "unc_percentage": round(unc_mask.sum() / N * 100, 1),
            "paying_without_unc": int((paid_mask & ~unc_mask).sum()),
            "paying_without_unc_percentage": round((paid_mask & ~unc_mask).sum() / N * 100, 1),
            "estimated_semester_spend": (claude_paid * 20 * 4) + (gpt_paid * 20 * 4) + (deepseek_paid * 10 * 4),
            "claude_subscribers": claude_paid,
            "gpt_subscribers": gpt_paid
        },
        "platforms": platforms,
        "segments": segments,
        "discovery": discovery,
        "tasks": tasks,
        "recent_tools": recent_tools
    }

def export_frontend_data():
    payload = build_survey_payload()
    destinations = [
        "../data-viz-challenge/src/data/survey_data.json",
        "../data-viz-challenge/public/survey_data.json"
    ]
    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w") as f:
            json.dump(payload, f, indent=2)
        print(f"Exported JSON payload to: {dest}")


# -------------------------------------------------------------
# 3. Optional Lightweight Backend Server (python main.py --serve)
# -------------------------------------------------------------
class SurveyDataHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for Vite frontend
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/data':
            payload = build_survey_payload()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode('utf-8'))
        elif parsed.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "records": N}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_backend_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), SurveyDataHandler)
    print(f"\n[Backend API Server] Running on http://localhost:{port}")
    print(f"Endpoints: http://localhost:{port}/api/data  |  http://localhost:{port}/api/health")
    print("Press Ctrl+C to terminate.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping backend server...")
        server.server_close()


# -------------------------------------------------------------
# Main Execution
# -------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--serve":
        run_backend_server()
    else:
        print("\n--- Generating Static Visualizations for Story Angle 1 ---")
        plot_funding_divide(df, os.path.join(output_dir, "story1_funding_divide.png"))
        plot_familiarity_gap(df, os.path.join(output_dir, "story1_familiarity_gap.png"))
        plot_frequency_comparison(df, os.path.join(output_dir, "story1_frequency_comparison.png"))
        plot_wallet_paradox(df, os.path.join(output_dir, "story1_wallet_paradox.png"))
        plot_executive_dashboard(df, os.path.join(output_dir, "story1_executive_dashboard.png"))
        
        print("\n--- Exporting Frontend JSON for React App ---")
        export_frontend_data()
        print("\nComplete! To launch the optional API server, run: python main.py --serve\n")
