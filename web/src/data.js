// Aggregates from the fall 2026 labels file, matching access_story.py.
// 46 respondents. Paid means a self- or family-funded version.

export const groups = [
  { label: "Paid, no UNC version", value: 17, display: "17 (37%)" },
  { label: "Paid and UNC version", value: 14, display: "14 (30%)" },
  { label: "Free only", value: 10, display: "10 (22%)" },
  { label: "UNC version, no paid plan", value: 5, display: "5 (11%)", highlight: true },
]

export const tools = [
  { label: "Claude", paid: 19, unc: 2 },
  { label: "ChatGPT", paid: 17, unc: 2 },
  { label: "Gemini", paid: 7, unc: 3 },
  { label: "Grok", paid: 3, unc: 0 },
  { label: "Perplexity", paid: 2, unc: 1 },
  { label: "Meta AI", paid: 2, unc: 0 },
  { label: "UNC Copilot", paid: 0, unc: 8 },
  { label: "PromptLab", paid: 0, unc: 7 },
  { label: "Copilot", paid: 0, unc: 6 },
]

export const toolScale = 20

export const paidHighlight = new Set(["Claude", "ChatGPT"])
export const uncHighlight = new Set(["UNC Copilot", "PromptLab", "Copilot"])
