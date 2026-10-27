import { groups, paidHighlight, toolScale, tools, uncHighlight } from "./data.js"

function Chart({ title, subtitle, source, rows, axisMax, ticks, xLabel, yLabel }) {
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
            const share = (row.value / axisMax) * 100
            return (
              <div className="row" key={row.label}>
                <span className="label">{row.label}</span>
                <span className="scale">
                  <span
                    className={row.highlight ? "bar highlight" : "bar"}
                    style={{ width: `${share}%` }}
                  />
                  <span className="value" style={{ left: `${share}%` }}>
                    {row.display ?? row.value}
                  </span>
                </span>
              </div>
            )
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
  )
}

const groupSource =
  "Source: DATA 150 fall 2026 generative AI survey. Paid means a self- or family-funded version. Students who pay may also use free tools."

const toolSource =
  "A student can be counted for more than one tool. Free is still the most common version of ChatGPT (23) and Gemini (21). Tools with fewer than 2 paid or UNC users are omitted. Source: DATA 150 fall 2026 generative AI survey."

export default function App() {
  const paidRows = tools.map((tool) => ({
    label: tool.label,
    value: tool.paid,
    highlight: paidHighlight.has(tool.label),
  }))
  const uncRows = tools.map((tool) => ({
    label: tool.label,
    value: tool.unc,
    highlight: uncHighlight.has(tool.label),
  }))

  return (
    <main>
      <header className="intro">
        <p className="kicker">Fall 2026 · 46 students</p>
        <h1>How students access generative AI</h1>
      </header>

      <Chart
        title="Few students rely on a UNC tool alone"
        subtitle="Each of 46 students is in one group, fall 2026"
        source={groupSource}
        rows={groups}
        axisMax={20}
        ticks={[0, 5, 10, 15, 20]}
        yLabel="Access group"
        xLabel="Number of students"
      />

      <section className="panels" aria-label="Paid plans and UNC versions">
        <Chart
          title="Claude and ChatGPT are what students pay for"
          subtitle="Self- or family-funded version, out of 46 students"
          source=""
          rows={paidRows}
          axisMax={toolScale}
          ticks={[0, 5, 10, 15, 20]}
          yLabel="Tool"
          xLabel="Number of students"
        />
        <Chart
          title="UNC versions cluster on Copilot and PromptLab"
          subtitle="UNC-provided version. UNC Copilot is Copilot with Data Protection."
          source=""
          rows={uncRows}
          axisMax={toolScale}
          ticks={[0, 5, 10, 15, 20]}
          yLabel="Tool"
          xLabel="Number of students"
        />
      </section>
      <p className="source shared">{toolSource}</p>
    </main>
  )
}
