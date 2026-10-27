import surveyData from './data/survey_data.json';

// Johnny's Checklist Dataset
export const groups = [
  { 
    id: "paid-no-unc",
    label: "Paid, no UNC version", 
    value: 17, 
    display: "17 (37%)",
    desc: "Students paying out-of-pocket for Claude Pro or ChatGPT Plus while completely ignoring UNC's free enterprise solutions.",
    highlight: false
  },
  { 
    id: "paid-and-unc",
    label: "Paid and UNC version", 
    value: 14, 
    display: "14 (30%)",
    desc: "Hybrid users who take advantage of UNC Copilot but still maintain personal paid subscriptions for advanced coding and reasoning.",
    highlight: false
  },
  { 
    id: "free-only",
    label: "Free only", 
    value: 10, 
    display: "10 (22%)",
    desc: "Students relying strictly on free commercial tiers (ChatGPT Free, Gemini, DeepSeek), avoiding both paid tools and campus offerings.",
    highlight: false
  },
  { 
    id: "unc-only",
    label: "UNC version, no paid plan", 
    value: 5, 
    display: "5 (11%)", 
    displayNote: "Key Finding",
    desc: "Only 5 out of 46 students rely exclusively on UNC-provided AI tools without paying for an external subscription.",
    highlight: true 
  },
];

export const tools = [
  { label: "Claude", paid: 19, unc: 2, vendor: "Anthropic" },
  { label: "ChatGPT", paid: 17, unc: 2, vendor: "OpenAI" },
  { label: "Gemini", paid: 7, unc: 3, vendor: "Google" },
  { label: "Grok", paid: 3, unc: 0, vendor: "xAI" },
  { label: "Perplexity", paid: 2, unc: 1, vendor: "Perplexity AI" },
  { label: "Meta AI", paid: 2, unc: 0, vendor: "Meta" },
  { label: "UNC Copilot", paid: 0, unc: 8, vendor: "UNC / Microsoft" },
  { label: "PromptLab", paid: 0, unc: 7, vendor: "UNC Library" },
  { label: "Copilot", paid: 0, unc: 6, vendor: "Microsoft" },
];

export const toolScale = 20;

export const paidHighlight = new Set(["Claude", "ChatGPT"]);
export const uncHighlight = new Set(["UNC Copilot", "PromptLab", "Copilot"]);

export { surveyData };
