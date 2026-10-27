import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { 
  DollarSign, ShieldAlert, Users, Sparkles, TrendingUp, 
  HelpCircle, Activity, Award, CheckCircle, Info, ChevronRight, BarChart3, BookOpen
} from 'lucide-react';
import './App.css';

// Unified data module containing Johnny's rubric datasets + Andrew's survey payload
import { groups, tools, toolScale, paidHighlight, uncHighlight, surveyData as fallbackData } from './data.js';

// Color Palette Constants
const CAROLINA_BLUE = "#4B9CD3";
const NAVY_BLUE = "#13294B";
const PAID_COLOR = "#D9534F";
const FREE_COLOR = "#2A9D8F";
const UNC_COLOR = "#4B9CD3";
const INACTIVE_COLOR = "#CBD5E1";

// -------------------------------------------------------------
// Johnny's Checklist Chart Component (Evergreen Data Rubric)
// -------------------------------------------------------------
function ChecklistChart({ title, subtitle, source, rows, axisMax, ticks, xLabel, yLabel, onRowClick, selectedRow }) {
  return (
    <figure className="chart">
      <h2>{title}</h2>
      <p className="subtitle">{subtitle}</p>
      <div className="chart-body">
        <div className="axis-head">
          <span className="y-axis-label">{yLabel}</span>
        </div>
        <div className="rows">
          {rows.map((row) => {
            const share = (row.value / axisMax) * 100;
            const isHighlighted = row.highlight;
            const isSelected = selectedRow === row.label;
            return (
              <div 
                className={`row clickable-row ${isSelected ? 'selected' : ''}`} 
                key={row.label}
                onClick={() => onRowClick && onRowClick(row)}
                title="Click to view details"
              >
                <span className="label">{row.label}</span>
                <span className="scale">
                  <span
                    className={isHighlighted ? "bar highlight" : "bar"}
                    style={{ width: `${share}%` }}
                  />
                  <span className="value" style={{ left: `${share}%` }}>
                    {row.display ?? row.value}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="x-axis-row">
          <span className="axis-spacer" aria-hidden="true" />
          <div className="x-axis" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="tick" style={{ left: `${(tick / axisMax) * 100}%` }}>
                {tick}
              </span>
            ))}
            <span className="x-axis-label">{xLabel}</span>
          </div>
        </div>
      </div>
      {source ? <figcaption>{source}</figcaption> : null}
    </figure>
  );
}

export default function App() {
  const [data, setData] = useState(fallbackData);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [activeTab, setActiveTab] = useState('access-story'); // 'access-story' | 'funding' | 'funnel' | 'frequency' | 'simulator' | 'quiz'
  
  // Johnny's Checklist state
  const [selectedGroup, setSelectedGroup] = useState(groups[3]); // Default to UNC-only highlight
  const [selectedToolRow, setSelectedToolRow] = useState(null);

  // Andrew's interactive explorer state
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedPlatformId, setSelectedPlatformId] = useState('claude');
  const [monthlyPrice, setMonthlyPrice] = useState(20);
  const [semesterMonths, setSemesterMonths] = useState(4);
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Persona Quiz State
  const [quizAnswers, setQuizAnswers] = useState({
    frequency: 'daily',
    pays: 'yes',
    usesUnc: 'no'
  });

  // Attempt connection to Python backend (if user started `python main.py --serve`)
  useEffect(() => {
    fetch('http://localhost:8000/api/data')
      .then(res => res.json())
      .then(remoteData => {
        if (remoteData && remoteData.summary) {
          setData(remoteData);
          setIsBackendLive(true);
        }
      })
      .catch(() => {
        setIsBackendLive(false); // Seamlessly fallback to embedded JSON
      });
  }, []);

  // Filtered platforms for the charts
  const filteredPlatforms = data.platforms.filter(p => {
    if (platformFilter === 'commercial') return !p.is_unc;
    if (platformFilter === 'unc') return p.is_unc;
    if (platformFilter === 'paid') return p.paid_count > 0;
    return true;
  });

  const selectedPlatform = data.platforms.find(p => p.id === selectedPlatformId) || data.platforms[0];

  // Dynamic simulation calculations
  const totalPaidSubs = data.summary.claude_subscribers + data.summary.gpt_subscribers + 1;
  const simulatedTotalSpend = totalPaidSubs * monthlyPrice * semesterMonths;
  const potentialSavings = simulatedTotalSpend;

  // Archetype Matcher Logic
  const calculateArchetype = () => {
    const { frequency, pays, usesUnc } = quizAnswers;
    if (pays === 'yes' && usesUnc === 'no') {
      return {
        title: "The Out-of-Pocket Power User",
        share: "37.0% of DATA 150 Class (17 students)",
        desc: "You prioritize frontier AI intelligence (Claude Pro / ChatGPT Plus) and are willing to fund it yourself, completely ignoring UNC's free enterprise solutions.",
        color: PAID_COLOR
      };
    }
    if (pays === 'yes' && usesUnc === 'yes') {
      return {
        title: "The Enterprise Hybrid",
        share: "30.4% of DATA 150 Class (14 students)",
        desc: "You hedge your bets: using UNC-provided Copilot for privacy/safe coursework while keeping a private paid subscription for tough coding and creative tasks.",
        color: "#E88873"
      };
    }
    if (pays === 'no' && usesUnc === 'yes') {
      return {
        title: "The Campus Loyalist",
        share: "10.9% of DATA 150 Class (5 students)",
        desc: "You maximize university tuition ROI! You rely on UNC's protected Copilot and campus PromptLab, keeping your AI expenses at exactly $0.",
        color: UNC_COLOR
      };
    }
    return {
      title: "The Frugal Hacker",
      share: "21.7% of DATA 150 Class (10 students)",
      desc: "You extract maximum value from free commercial tiers (ChatGPT Free, DeepSeek, Gemini). You refuse to pay out of pocket, but also avoid institutional tools.",
      color: FREE_COLOR
    };
  };

  const userArchetype = calculateArchetype();

  // Rows for Johnny's panels
  const paidRows = tools.map((tool) => ({
    label: tool.label,
    value: tool.paid,
    highlight: paidHighlight.has(tool.label),
    vendor: tool.vendor
  }));
  const uncRows = tools.map((tool) => ({
    label: tool.label,
    value: tool.unc,
    highlight: uncHighlight.has(tool.label),
    vendor: tool.vendor
  }));

  const groupSource = "Source: DATA 150 fall 2026 generative AI survey. Paid means a self- or family-funded version. Students who pay may also use free tools.";
  const toolSource = "A student can be counted for more than one tool. Free is still the most common version of ChatGPT (23) and Gemini (21). Tools with fewer than 2 paid or UNC users are omitted. Source: DATA 150 fall 2026 generative AI survey.";

  return (
    <div className="app-container">
      {/* ----------------- NAVBAR ----------------- */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="unc-logo-badge">UNC CS</span>
            <div>
              <h1 className="nav-title">DATA 150 Data Visualization Challenge</h1>
              <p className="nav-subtitle">By Andrew Barber & Johnny • Fall 2026 Student AI Analysis</p>
            </div>
          </div>
          <div className="nav-status">
            <span className={`status-dot ${isBackendLive ? 'online' : 'offline'}`} />
            <span>{isBackendLive ? 'Live Python API (Port 8000)' : 'Embedded JSON Mode (Client-Side)'}</span>
          </div>
        </div>
      </nav>

      {/* ----------------- HERO BANNER ----------------- */}
      <header className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">Fall 2026 • 46 Students • Story Angle 1</span>
          <h2 className="hero-title">How Students Access Generative AI: Enterprise vs. Student Reality</h2>
          <p className="hero-desc">
            UNC provides enterprise Copilot licenses with Data Protection and campus PromptLabs. 
            Yet our empirical survey reveals a stark divide: 67% of students pay out-of-pocket for frontier commercial AI, 
            while only 11% rely on the university’s free tools alone.
          </p>
        </div>
      </header>

      {/* ----------------- HERO KPI CARDS ----------------- */}
      <section className="kpi-grid">
        <div 
          className={`kpi-card ${activeTab === 'access-story' ? 'active' : ''}`}
          onClick={() => setActiveTab('access-story')}
        >
          <div className="kpi-header">
            <span className="kpi-label">UNC Only Reliance</span>
            <div className="kpi-icon-wrap" style={{ background: '#EFF6FF', color: NAVY_BLUE }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-value">11%</div>
          <p className="kpi-subtext">
            <strong>Only 5 students</strong> rely strictly on UNC-provided AI tools
          </p>
        </div>

        <div 
          className={`kpi-card ${activeTab === 'funding' ? 'active' : ''}`}
          onClick={() => setActiveTab('funding')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Self-Funded Ratio</span>
            <div className="kpi-icon-wrap" style={{ background: '#FEE2E2', color: PAID_COLOR }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value">{data.summary.paying_percentage}%</div>
          <p className="kpi-subtext">
            <strong>31 of 46 students</strong> pay out-of-pocket for AI tools
          </p>
        </div>

        <div 
          className={`kpi-card ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <div className="kpi-header">
            <span className="kpi-label">Estimated Cohort Spend</span>
            <div className="kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">${data.summary.estimated_semester_spend.toLocaleString()}</div>
          <p className="kpi-subtext">
            Spent this semester on Claude & ChatGPT Plus
          </p>
        </div>

        <div 
          className={`kpi-card ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <div className="kpi-header">
            <span className="kpi-label">PromptLab Blindspot</span>
            <div className="kpi-icon-wrap" style={{ background: '#EFF6FF', color: CAROLINA_BLUE }}>
              <HelpCircle size={20} />
            </div>
          </div>
          <div className="kpi-value">72%</div>
          <p className="kpi-subtext">
            Students unaware or non-users of UNC PromptLab
          </p>
        </div>
      </section>

      {/* ----------------- MAIN INTERACTIVE CONTENT ----------------- */}
      <main className="main-content">
        {/* Navigation Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'access-story' ? 'active' : ''}`}
            onClick={() => setActiveTab('access-story')}
          >
            <BookOpen size={18} />
            1. The Access Story (Evergreen Rubric)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'funding' ? 'active' : ''}`}
            onClick={() => setActiveTab('funding')}
          >
            <DollarSign size={18} />
            2. Platform & License Explorer
          </button>
          <button 
            className={`tab-btn ${activeTab === 'funnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('funnel')}
          >
            <Activity size={18} />
            3. Institutional Awareness Funnel
          </button>
          <button 
            className={`tab-btn ${activeTab === 'frequency' ? 'active' : ''}`}
            onClick={() => setActiveTab('frequency')}
          >
            <TrendingUp size={18} />
            4. Usage Intensity & Tasks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Sparkles size={18} />
            5. Campus ROI & Wallet Simulator
          </button>
          <button 
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <Award size={18} />
            6. "Find Your AI Persona" Quiz
          </button>
        </div>

        {/* =========================================================
            TAB 1: JOHNNY'S ACCESS STORY (CHECKLIST-COMPLIANT VIEW)
        ========================================================= */}
        {activeTab === 'access-story' && (
          <div className="checklist-story-wrapper">
            <header className="checklist-story-header">
              <p className="kicker">Evergreen Rubric Presentation • Fall 2026 • 46 students</p>
              <h2>The Access Story: Who Pays for AI at UNC?</h2>
            </header>

            {/* Johnny's First Chart: 4 Access Groups */}
            <ChecklistChart
              title="Few students rely on a UNC tool alone"
              subtitle="Each of 46 students is in one mutually exclusive access group, fall 2026 (click rows to inspect)"
              source={groupSource}
              rows={groups}
              axisMax={20}
              ticks={[0, 5, 10, 15, 20]}
              yLabel="Access group"
              xLabel="Number of students"
              onRowClick={(row) => setSelectedGroup(row)}
              selectedRow={selectedGroup ? selectedGroup.label : null}
            />

            {/* Interactive Drilldown Box for Johnny's Chart 1 */}
            {selectedGroup && (
              <div className="checklist-detail-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: '1.05rem', color: NAVY_BLUE }}>
                    {selectedGroup.label}: {selectedGroup.display}
                  </strong>
                  {selectedGroup.highlight && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#EFF6FF', color: NAVY_BLUE, padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      Key Insight
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, color: '#334155' }}>{selectedGroup.desc}</p>
              </div>
            )}

            {/* Johnny's Second Chart: Side-by-Side Panels */}
            <section className="panels" aria-label="Paid plans and UNC versions">
              <ChecklistChart
                title="Claude and ChatGPT are what students pay for"
                subtitle="Self- or family-funded version, out of 46 students"
                source=""
                rows={paidRows}
                axisMax={toolScale}
                ticks={[0, 5, 10, 15, 20]}
                yLabel="Tool"
                xLabel="Number of students"
                onRowClick={(row) => {
                  setSelectedToolRow(row);
                  const matched = data.platforms.find(p => p.name.toLowerCase().includes(row.label.toLowerCase()));
                  if (matched) setSelectedPlatformId(matched.id);
                }}
                selectedRow={selectedToolRow ? selectedToolRow.label : null}
              />

              <ChecklistChart
                title="UNC versions cluster on Copilot and PromptLab"
                subtitle="UNC-provided version. UNC Copilot is Copilot with Data Protection."
                source=""
                rows={uncRows}
                axisMax={toolScale}
                ticks={[0, 5, 10, 15, 20]}
                yLabel="Tool"
                xLabel="Number of students"
                onRowClick={(row) => {
                  setSelectedToolRow(row);
                  const matched = data.platforms.find(p => p.name.toLowerCase().includes(row.label.toLowerCase()));
                  if (matched) setSelectedPlatformId(matched.id);
                }}
                selectedRow={selectedToolRow ? selectedToolRow.label : null}
              />
            </section>
            <p className="source shared">{toolSource}</p>

            {selectedToolRow && (
              <div className="checklist-detail-box" style={{ borderLeftColor: CAROLINA_BLUE }}>
                <strong>Tool Highlight: {selectedToolRow.label}</strong>
                <p style={{ margin: '4px 0 0', color: '#334155' }}>
                  {selectedToolRow.label === "Claude" && "Claude 3.5 Sonnet is the runaway favorite for students paying out-of-pocket (19 subscribers), driven by strong demand for coding and structured artifact creation."}
                  {selectedToolRow.label === "ChatGPT" && "ChatGPT Plus follows closely with 17 paying students, widely used for general reasoning, problem-solving, and web searching."}
                  {selectedToolRow.label === "UNC Copilot" && "UNC Copilot (Microsoft Copilot with Commercial Data Protection) is the primary official campus tool, but only 8 students actively use it."}
                  {selectedToolRow.label === "PromptLab" && "UNC Library PromptLab offers free frontier AI access, but 72% of the cohort has never used it due to low campus awareness."}
                  {!["Claude", "ChatGPT", "UNC Copilot", "PromptLab"].includes(selectedToolRow.label) && `Counted in the survey with ${selectedToolRow.value} students reporting usage.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: THE FUNDING DIVIDE & PLATFORM INSPECTOR
        ========================================================= */}
        {activeTab === 'funding' && (
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Platform License Model Breakdown</h3>
                  <p className="card-subtitle">
                    Click any bar or platform to inspect subscription economics & task details
                  </p>
                </div>
                <div className="filter-pills">
                  <button 
                    className={`filter-pill ${platformFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPlatformFilter('all')}
                  >
                    All Tools
                  </button>
                  <button 
                    className={`filter-pill ${platformFilter === 'commercial' ? 'active' : ''}`}
                    onClick={() => setPlatformFilter('commercial')}
                  >
                    Commercial
                  </button>
                  <button 
                    className={`filter-pill ${platformFilter === 'unc' ? 'active' : ''}`}
                    onClick={() => setPlatformFilter('unc')}
                  >
                    UNC Official
                  </button>
                  <button 
                    className={`filter-pill ${platformFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => setPlatformFilter('paid')}
                  >
                    Paid Only
                  </button>
                </div>
              </div>

              {/* Recharts Interactive Stacked Bar Chart */}
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={filteredPlatforms}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 60, bottom: 20 }}
                    onClick={(e) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        setSelectedPlatformId(e.activePayload[0].payload.id);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 46]} tickCount={6} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: NAVY_BLUE }} />
                    <Tooltip 
                      formatter={(val, name) => [`${val} students (${(val/46*100).toFixed(0)}%)`, name]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="paid_count" name="Self/Family Paid ($)" stackId="a" fill={PAID_COLOR} cursor="pointer" />
                    <Bar dataKey="free_count" name="Free Tier" stackId="a" fill={FREE_COLOR} cursor="pointer" />
                    <Bar dataKey="unc_count" name="UNC-Provided" stackId="a" fill={CAROLINA_BLUE} cursor="pointer" />
                    <Bar dataKey="inactive_count" name="Inactive / Unused" stackId="a" fill={INACTIVE_COLOR} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Info size={14} /> Tip: Click any row in the chart to inspect that tool in the side panel.
                </span>
              </div>
            </div>

            {/* Interactive Platform Inspector Drawer */}
            <div className="inspector-card">
              <div className="inspector-header">
                <div>
                  <span className={`inspector-badge ${selectedPlatform.is_unc ? 'unc' : 'commercial'}`}>
                    {selectedPlatform.is_unc ? 'UNC Enterprise Tool' : 'Commercial Platform'}
                  </span>
                  <h4 className="inspector-title">{selectedPlatform.name}</h4>
                  <p className="inspector-vendor">Vendor: {selectedPlatform.vendor}</p>
                </div>
              </div>

              <div>
                <div className="stat-row">
                  <span className="stat-label">Paying Students:</span>
                  <span className="stat-val" style={{ color: PAID_COLOR }}>
                    {selectedPlatform.paid_count} ({selectedPlatform.paid_pct}%)
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${selectedPlatform.paid_pct}%`, backgroundColor: PAID_COLOR }} 
                  />
                </div>

                <div className="stat-row" style={{ marginTop: '0.75rem' }}>
                  <span className="stat-label">Free Tier Users:</span>
                  <span className="stat-val" style={{ color: FREE_COLOR }}>
                    {selectedPlatform.free_count} ({selectedPlatform.free_pct}%)
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${selectedPlatform.free_pct}%`, backgroundColor: FREE_COLOR }} 
                  />
                </div>

                <div className="stat-row" style={{ marginTop: '0.75rem' }}>
                  <span className="stat-label">UNC Provided Tier:</span>
                  <span className="stat-val" style={{ color: CAROLINA_BLUE }}>
                    {selectedPlatform.unc_count} ({selectedPlatform.unc_pct}%)
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${selectedPlatform.unc_pct}%`, backgroundColor: CAROLINA_BLUE }} 
                  />
                </div>
              </div>

              <div className="inspector-callout">
                <strong>Campus Reality:</strong> {selectedPlatform.is_unc ? (
                  "Funded under university enterprise agreement, but hampered by student preference for frontier reasoning and coding capabilities."
                ) : selectedPlatform.paid_count > 10 ? (
                  `Strong student willingness to self-fund (~$20/mo = $80/semester) due to perceived superiority in coding, reasoning, and context window.`
                ) : (
                  `Primarily adopted via free tiers with limited student conversion to paid subscriptions.`
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: NAVY_BLUE }}>Quick Platform Switch:</span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {data.platforms.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatformId(p.id)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: p.id === selectedPlatformId ? NAVY_BLUE : '#F8FAFC',
                        color: p.id === selectedPlatformId ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: p.id === selectedPlatformId ? 700 : 500
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: INSTITUTIONAL AWARENESS FUNNEL
        ========================================================= */}
        {activeTab === 'funnel' && (
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>The Institutional Awareness Gap</h3>
                  <p className="card-subtitle">
                    Commercial Giants (ChatGPT & Claude) vs. Official UNC Offerings (Copilot & PromptLab)
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { name: "ChatGPT", never: 0, heard: 0, exp: 2.2, active: 97.8 },
                      { name: "Claude AI", never: 4.3, heard: 10.9, exp: 13.0, active: 71.7 },
                      { name: "Google Gemini", never: 4.3, heard: 6.5, exp: 19.6, active: 69.6 },
                      { name: "UNC Copilot", never: 26.1, heard: 39.1, exp: 19.6, active: 15.2 },
                      { name: "UNC PromptLab", never: 52.2, heard: 19.6, exp: 10.9, active: 17.4 }
                    ]}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 70, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" unit="%" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12, fill: NAVY_BLUE }} />
                    <Tooltip 
                      formatter={(val, name) => [`${val}%`, name]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="never" name="Never Heard of It" stackId="a" fill="#E05A47" />
                    <Bar dataKey="heard" name="Heard but Never Used" stackId="a" fill="#F4A261" />
                    <Bar dataKey="exp" name="Experimented Only" stackId="a" fill="#80B1D3" />
                    <Bar dataKey="active" name="Active / Frequent Use" stackId="a" fill="#2A9D8F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Where Do Students Learn About AI?</h3>
                  <p className="card-subtitle">The "Shadow Curriculum" on Campus</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {data.discovery.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.channel}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count} students ({item.percentage}%)</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${item.percentage}%`, 
                          backgroundColor: item.category === 'Peer / Organic' ? '#F4A261' : CAROLINA_BLUE 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="inspector-callout" style={{ marginTop: '1.25rem' }}>
                <strong>Key Takeaway:</strong> Peer recommendation (83%) and social media (83%) massively outpace formal university workshops (41%). 
                Official institutional communications are failing to drive adoption.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: USAGE INTENSITY (DAILY VS UNC)
        ========================================================= */}
        {activeTab === 'frequency' && (
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Frequency Gap: Commercial Regulars vs. UNC Copilot</h3>
                  <p className="card-subtitle">Active semester engagement intensity across 46 students</p>
                </div>
              </div>

              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { tier: "Daily / Multi-Daily", ChatGPT: 41.3, Claude: 39.1, UNCCopilot: 2.2 },
                      { tier: "Weekly (1-3x)", ChatGPT: 26.1, Claude: 21.7, UNCCopilot: 6.5 },
                      { tier: "Monthly (1-3x)", ChatGPT: 19.6, Claude: 15.2, UNCCopilot: 15.2 },
                      { tier: "Inactive / Never", ChatGPT: 13.0, Claude: 23.9, UNCCopilot: 76.1 }
                    ]}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="tier" tick={{ fontSize: 11, fill: NAVY_BLUE }} />
                    <YAxis unit="%" domain={[0, 80]} />
                    <Tooltip 
                      formatter={(val, name) => [`${val}%`, name]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="ChatGPT" fill={CAROLINA_BLUE} />
                    <Bar dataKey="Claude" fill="#7C3AED" />
                    <Bar dataKey="UNCCopilot" name="UNC Protected Copilot" fill={PAID_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Dominant Tasks in DATA 150</h3>
                  <p className="card-subtitle">What students actually execute with AI</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 380, overflowY: 'auto' }}>
                {data.tasks.slice(0, 8).map((t, idx) => (
                  <div key={idx} style={{ padding: '0.5rem', background: '#F8FAFC', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: NAVY_BLUE }}>{t.task}</span>
                      <span style={{ fontWeight: 700, color: CAROLINA_BLUE }}>{t.percentage}%</span>
                    </div>
                    <div className="progress-bar-container" style={{ marginTop: 4 }}>
                      <div className="progress-fill" style={{ width: `${t.percentage}%`, backgroundColor: CAROLINA_BLUE }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: STUDENT WALLET & ROI SIMULATOR
        ========================================================= */}
        {activeTab === 'simulator' && (
          <div className="simulator-container">
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Campus AI Wallet Simulator</h3>
                  <p className="card-subtitle">
                    Estimate out-of-pocket spending for this 46-student cohort
                  </p>
                </div>
              </div>

              {/* Slider 1: Monthly Cost */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-title">Monthly Pro Subscription Cost:</span>
                  <span className="slider-badge">${monthlyPrice}/mo</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="40" 
                  step="5" 
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                  className="slider-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>$10 (Student Tier)</span>
                  <span>$20 (Standard Pro/Plus)</span>
                  <span>$40 (Multi-Tool)</span>
                </div>
              </div>

              {/* Slider 2: Semester Length */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-title">Academic Duration:</span>
                  <span className="slider-badge">{semesterMonths} Months</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="12" 
                  step="1" 
                  value={semesterMonths}
                  onChange={(e) => setSemesterMonths(Number(e.target.value))}
                  className="slider-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>1 Mo (Exam Cram)</span>
                  <span>4 Mo (One Semester)</span>
                  <span>12 Mo (Full Year)</span>
                </div>
              </div>

              {/* Dynamic Results Box */}
              <div className="simulation-results-box">
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>
                    Calculated Cohort Expenditure
                  </span>
                  <div className="sim-metric-big">${simulatedTotalSpend.toLocaleString()}</div>
                  <p style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
                    Calculated across {totalPaidSubs} verified paying subscriptions in this 46-student class.
                  </p>
                </div>

                <div className="sim-savings-badge">
                  <CheckCircle size={18} />
                  <span>
                    <strong>${potentialSavings.toLocaleString()}</strong> potential student savings if university tools met user needs
                  </span>
                </div>
              </div>
            </div>

            {/* Adoption Segmentation Interactive Donut */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Cohort Funding Segmentation</h3>
                  <p className="card-subtitle">Click a slice to explore behavioral profile</p>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.segments}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      cursor="pointer"
                      onClick={(entry) => setSelectedSegment(entry.payload)}
                    >
                      {data.segments.map((seg, idx) => (
                        <Cell key={`cell-${idx}`} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name) => [`${val} students (${(val/46*100).toFixed(1)}%)`, name]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                {selectedSegment ? (
                  <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: 8, border: `1px solid ${selectedSegment.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: selectedSegment.color }}>{selectedSegment.name}</strong>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selectedSegment.count} students ({selectedSegment.percentage}%)</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSegment.desc}</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {data.segments.map((seg, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedSegment(seg)}
                        style={{ 
                          padding: '0.5rem', 
                          border: '1px solid var(--border)', 
                          borderRadius: 6, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{seg.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: FIND YOUR AI PERSONA QUIZ
        ========================================================= */}
        {activeTab === 'quiz' && (
          <div className="quiz-container">
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <h3>Interactive Persona Matcher</h3>
                  <p className="card-subtitle">
                    Answer 3 questions to discover your student archetype in the Fall 2026 dataset
                  </p>
                </div>
              </div>

              {/* Question 1 */}
              <div className="quiz-question">
                <h4 className="quiz-question-title">1. How often do you use generative AI?</h4>
                <div className="quiz-options">
                  <button 
                    className={`quiz-option-btn ${quizAnswers.frequency === 'daily' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, frequency: 'daily' })}
                  >
                    <span>Daily or multiple times a day</span>
                    {quizAnswers.frequency === 'daily' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                  <button 
                    className={`quiz-option-btn ${quizAnswers.frequency === 'weekly' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, frequency: 'weekly' })}
                  >
                    <span>Weekly (1–3 times a week)</span>
                    {quizAnswers.frequency === 'weekly' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                  <button 
                    className={`quiz-option-btn ${quizAnswers.frequency === 'rarely' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, frequency: 'rarely' })}
                  >
                    <span>Rarely or never</span>
                    {quizAnswers.frequency === 'rarely' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                </div>
              </div>

              {/* Question 2 */}
              <div className="quiz-question">
                <h4 className="quiz-question-title">2. Do you or your family pay for an AI subscription?</h4>
                <div className="quiz-options">
                  <button 
                    className={`quiz-option-btn ${quizAnswers.pays === 'yes' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, pays: 'yes' })}
                  >
                    <span>Yes (e.g. Claude Pro, ChatGPT Plus)</span>
                    {quizAnswers.pays === 'yes' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                  <button 
                    className={`quiz-option-btn ${quizAnswers.pays === 'no' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, pays: 'no' })}
                  >
                    <span>No (Strictly free tiers)</span>
                    {quizAnswers.pays === 'no' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                </div>
              </div>

              {/* Question 3 */}
              <div className="quiz-question">
                <h4 className="quiz-question-title">3. Do you use UNC's Copilot with Data Protection?</h4>
                <div className="quiz-options">
                  <button 
                    className={`quiz-option-btn ${quizAnswers.usesUnc === 'yes' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, usesUnc: 'yes' })}
                  >
                    <span>Yes, I use the UNC enterprise login</span>
                    {quizAnswers.usesUnc === 'yes' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                  <button 
                    className={`quiz-option-btn ${quizAnswers.usesUnc === 'no' ? 'selected' : ''}`}
                    onClick={() => setQuizAnswers({ ...quizAnswers, usesUnc: 'no' })}
                  >
                    <span>No, I don't use it</span>
                    {quizAnswers.usesUnc === 'no' && <CheckCircle size={16} color={CAROLINA_BLUE} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Archetype Result Match Card */}
            <div className="archetype-result-card">
              <div className="archetype-icon-circle">
                <Award size={32} />
              </div>
              <span className="archetype-cohort-stat">{userArchetype.share}</span>
              <h3 className="archetype-title" style={{ color: userArchetype.color }}>
                {userArchetype.title}
              </h3>
              <p className="archetype-description">{userArchetype.desc}</p>

              <div style={{ width: '100%', background: '#F8FAFC', padding: '1rem', borderRadius: 8, textAlign: 'left', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: NAVY_BLUE }}>Why this matters for UNC:</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  University administration often assumes that providing a generic enterprise AI model covers student needs. 
                  In reality, students differentiate strongly between basic chatbots and high-performance coding/reasoning environments.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="footer">
        <p>
          DATA 150 Data Visualization Challenge • Fall 2026 • Created by Andrew Barber & Johnny
        </p>
      </footer>
    </div>
  );
}
