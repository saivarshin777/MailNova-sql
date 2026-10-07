import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  FaBell,
  FaBolt,
  FaBullseye,
  FaChartLine,
  FaDownload,
  FaEnvelopeOpenText,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaMousePointer,
  FaPaperPlane,
  FaUsers,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const fallbackAnalytics = {
  kpis: {
    totalEmailsSent: 101300,
    openRate: 76.8,
    ctr: 15,
    bounceRate: 2.3,
    conversionRate: 20.8,
    revenue: 54862,
  },
  executiveSummary: [
    { label: "Audience Quality", value: "72%", detail: "active and reachable contacts" },
    { label: "Subscriber Growth", value: "2.4K", detail: "new contacts in the last 30 days" },
    { label: "Campaign Velocity", value: "18", detail: "sent or active campaigns" },
  ],
  performanceTrend: {
    labels: ["Jun 8", "Jun 9", "Jun 10", "Jun 11", "Jun 12", "Jun 13", "Jun 14"],
    datasets: [
      {
        label: "Emails Sent",
        data: [8200, 9600, 10400, 11200, 12700, 13400, 14800],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Opened",
        data: [5700, 6500, 7100, 7900, 8700, 9100, 10400],
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.08)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Clicked",
        data: [1400, 1600, 1700, 1900, 2100, 2300, 2600],
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.08)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Unread",
        data: [2500, 3000, 3300, 3300, 4000, 4300, 4400],
        borderColor: "#64748b",
        backgroundColor: "rgba(100, 116, 139, 0.08)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  engagementDistribution: {
    labels: ["Opened", "Clicked", "Bounced", "Unopened"],
    datasets: [
      {
        data: [77880, 15215, 2310, 21110],
        backgroundColor: ["#14b8a6", "#d97706", "#ef4444", "#64748b"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  },
  readUnreadByCampaign: {
    labels: ["Summer Launch", "Festive Offers", "New Arrivals"],
    datasets: [
      {
        label: "Read/Open",
        data: [36900, 23180, 17800],
        backgroundColor: "rgba(20, 184, 166, 0.82)",
        borderRadius: 8,
      },
      {
        label: "Unread",
        data: [6820, 6760, 7460],
        backgroundColor: "rgba(100, 116, 139, 0.72)",
        borderRadius: 8,
      },
    ],
  },
  openRateTrend: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Open Rate %",
        data: [58, 61, 66, 70, 74, 76.8],
        backgroundColor: "rgba(37, 99, 235, 0.78)",
        borderRadius: 8,
      },
    ],
  },
  ctrTrend: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
    datasets: [
      {
        label: "CTR %",
        data: [10.8, 11.4, 12.7, 13.6, 14.2, 15],
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  bounceBreakdown: {
    labels: ["Hard Bounce", "Soft Bounce", "Invalid Email", "Blocked Domain"],
    datasets: [
      {
        label: "Bounce %",
        data: [0.9, 0.7, 0.5, 0.2],
        backgroundColor: ["#ef4444", "#d97706", "#7c3aed", "#2563eb"],
        borderRadius: 8,
      },
    ],
  },
  deviceUsage: {
    labels: ["Desktop", "Mobile", "Tablet"],
    datasets: [
      {
        data: [47, 44, 9],
        backgroundColor: ["#2563eb", "#14b8a6", "#d97706"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  },
  audienceInsights: [
    { label: "New Subscribers", value: 12840, color: "#2563eb" },
    { label: "Returning", value: 98200, color: "#14b8a6" },
    { label: "Unsubscribed", value: 3410, color: "#ef4444" },
    { label: "Active Contacts", value: 204890, color: "#d97706" },
  ],
  regions: [
    { city: "Bangalore", contacts: 3200, share: 32 },
    { city: "Hyderabad", contacts: 2500, share: 25 },
    { city: "Chennai", contacts: 1800, share: 18 },
    { city: "Mumbai", contacts: 1500, share: 15 },
  ],
  automationPerformance: [
    { label: "Workflows Executed", value: 142, max: 200, color: "#2563eb" },
    { label: "Emails Triggered", value: 48920, max: 60000, color: "#d97706" },
    { label: "Successful Deliveries", value: 47200, max: 60000, color: "#14b8a6" },
    { label: "Estimated Revenue", value: 18400, max: 25000, color: "#ef4444" },
  ],
  campaigns: [
    { id: 1, name: "Summer Launch", sent: 45000, opened: 36900, unread: 6820, openRate: 82, ctr: 15.2, bounceRate: 2.6, revenue: 24624, status: "Active" },
    { id: 2, name: "Festive Offers", sent: 30500, opened: 23180, unread: 6760, openRate: 76, ctr: 15.8, bounceRate: 1.8, revenue: 17370, status: "Completed" },
    { id: 3, name: "New Arrivals", sent: 25800, opened: 17800, unread: 7460, openRate: 69, ctr: 13.8, bounceRate: 2.1, revenue: 12780, status: "Running" },
  ],
  activities: [
    { id: "a1", text: "Summer Launch delivered to 43,820 contacts", time: "Today", color: "#2563eb" },
    { id: "a2", text: "Festive Offers open rate reached 76%", time: "Yesterday", color: "#14b8a6" },
  ],
  notifications: [
    { id: "n1", title: "Campaign sent successfully", desc: "Summer Launch reached 45,000 recipients", time: "2 min ago", read: false },
  ],
};

const kpiConfig = [
  {
    key: "totalEmailsSent",
    label: "Total Emails Sent",
    icon: FaPaperPlane,
    color: "#2563eb",
    formatter: formatNumber,
    change: "+18.4%",
  },
  {
    key: "openRate",
    label: "Open Rate",
    icon: FaEnvelopeOpenText,
    color: "#14b8a6",
    formatter: (value) => `${Number(value || 0).toFixed(1)}%`,
    change: "+5.2%",
  },
  {
    key: "ctr",
    label: "Click-through Rate",
    icon: FaMousePointer,
    color: "#d97706",
    formatter: (value) => `${Number(value || 0).toFixed(1)}%`,
    change: "+3.1%",
  },
  {
    key: "bounceRate",
    label: "Bounce Rate",
    icon: FaExclamationTriangle,
    color: "#ef4444",
    formatter: (value) => `${Number(value || 0).toFixed(1)}%`,
    change: "-0.8%",
  },
  {
    key: "conversionRate",
    label: "Conversion Rate",
    icon: FaBullseye,
    color: "#7c3aed",
    formatter: (value) => `${Number(value || 0).toFixed(1)}%`,
    change: "+2.9%",
  },
  {
    key: "revenue",
    label: "Estimated Revenue",
    icon: FaChartLine,
    color: "#0f766e",
    formatter: formatCurrency,
    change: "+14.2%",
  },
];

function AnalyticsKpi({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="analytics-kpi">
      <div className="analytics-kpi-top">
        <span className="analytics-kpi-icon" style={{ color: item.color, background: `${item.color}16` }}>
          <Icon />
        </span>
        <span className={item.change.startsWith("-") ? "trend-pill soft-red" : "trend-pill"}>
          {item.change}
        </span>
      </div>
      <strong>{item.formatter(value)}</strong>
      <span>{item.label}</span>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="analytics-skeleton-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="analytics-skeleton" key={index} />
      ))}
    </div>
  );
}

export default function AdvancedAnalytics({ analytics, loading = false, darkMode = false, onRangeChange }) {
  const [dateRange, setDateRange] = useState("All Time");
  const data = analytics || fallbackAnalytics;

  useEffect(() => {
    onRangeChange?.(dateRange);
  }, [dateRange, onRangeChange]);

  const chartOptions = useMemo(() => {
    const textColor = darkMode ? "#cbd5e1" : "#475569";
    const gridColor = darkMode ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.2)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            boxWidth: 12,
            usePointStyle: true,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
      },
    };
  }, [darkMode]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: darkMode ? "#cbd5e1" : "#475569",
            boxWidth: 12,
            usePointStyle: true,
          },
        },
      },
    }),
    [darkMode]
  );

  const rankedCampaigns = [...(data.campaigns || [])].sort(
    (a, b) =>
      Number(b.openRate || 0) + Number(b.ctr || 0) + Number(b.conversionRate || 0) -
      (Number(a.openRate || 0) + Number(a.ctr || 0) + Number(a.conversionRate || 0))
  );
  const campaignScore = (campaign) =>
    Number(campaign?.openRate || 0) + Number(campaign?.ctr || 0) + Number(campaign?.conversionRate || 0) + Number(campaign?.revenue || 0);
  const bestCampaign = rankedCampaigns.find((campaign) => Number(campaign?.sent || 0) > 0 && campaignScore(campaign) > 0);
  const getCampaignReadCount = (campaign) =>
    Number(campaign.opened ?? (Math.round((Number(campaign.sent || 0) * Number(campaign.openRate || 0)) / 100) || 0));
  const getCampaignUnreadCount = (campaign) =>
    Number(campaign.unread ?? Math.max(Number(campaign.sent || 0) - getCampaignReadCount(campaign), 0));
  const failedDeliveryReasons = data.failedDeliveryReasons || [
    { reason: "Invalid or inactive email", count: 42, share: 38 },
    { reason: "Mailbox full", count: 26, share: 24 },
    { reason: "Blocked domain", count: 23, share: 21 },
    { reason: "Temporary provider issue", count: 18, share: 17 },
  ];

  const handleExport = (format = "json") => {
    if (format === "pdf") {
      window.print();
      return;
    }

    const csvRows = [
      ["Campaign", "Sent", "Read/Open", "Unread", "Open Rate", "CTR", "Bounce Rate", "Revenue", "Status"],
      ...(data.campaigns || []).map((campaign) => [
        campaign.name,
        campaign.sent,
        getCampaignReadCount(campaign),
        getCampaignUnreadCount(campaign),
        campaign.openRate,
        campaign.ctr,
        campaign.bounceRate,
        campaign.revenue,
        campaign.status,
      ]),
    ];
    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([format === "csv" ? csv : JSON.stringify(data, null, 2)], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = format === "csv" ? "mailnova-analytics-report.csv" : "mailnova-analytics-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analytics) {
    return <ChartSkeleton />;
  }

  if (!analytics) {
    return (
      <section className="analytics-command">
        <div className="empty-state compact-empty">
          <FaChartLine />
          <strong>No analytics data available</strong>
          <p>Start the backend or send a campaign to load live analytics.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="analytics-command">
      <div className="analytics-hero">
        <div>
          <span className="eyebrow">Analytics Command Center</span>
          <h1>Campaign intelligence built for client decisions</h1>
          <p>
            Performance, engagement quality, revenue signals, and audience health in one executive-ready view.
          </p>
        </div>
        <div className="analytics-toolbar">
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
            <option>All Time</option>
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button type="button" className="export-report-btn" onClick={() => handleExport("csv")}>
            <FaDownload />
            CSV
          </button>
          <button type="button" className="template-btn" onClick={() => handleExport("pdf")}>
            PDF
          </button>
        </div>
      </div>

      <div className="analytics-kpi-grid">
        {kpiConfig.map((item) => (
          <AnalyticsKpi key={item.key} item={item} value={data.kpis?.[item.key]} />
        ))}
      </div>

      {data.trackingConfig && !data.trackingConfig.isPublic && (
        <div className="info-banner error-banner">
          Gmail open pixels need a public tracking URL. Current tracking URL: {data.trackingConfig.baseUrl}
        </div>
      )}

      <div className="analytics-signal-row">
        {data.executiveSummary?.map((item) => (
          <div className="analytics-signal" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="analytics-three">
        <div className="analytics-panel best-campaign-card">
          <div className="analytics-panel-header">
            <div>
              <h3>Best Performing Campaign</h3>
              <p>Ranked by open rate, CTR, and conversion contribution</p>
            </div>
          </div>
          <strong>{bestCampaign?.name || "No clear winner yet"}</strong>
          <div className="best-campaign-metrics">
            <span>{Number(bestCampaign?.openRate || 0).toFixed(1)}% open</span>
            <span>{Number(bestCampaign?.ctr || 0).toFixed(1)}% CTR</span>
            <span>{formatCurrency(bestCampaign?.revenue || 0)}</span>
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Campaign Comparison</h3>
          </div>
          <div className="comparison-list">
            {rankedCampaigns.slice(0, 3).map((campaign, index) => (
              <div className="comparison-row" key={campaign.id || campaign.name}>
                <span>#{index + 1}</span>
                <strong>{campaign.name}</strong>
                <small>{Number(campaign.openRate || 0).toFixed(1)}% open</small>
              </div>
            ))}
            {!rankedCampaigns.length && (
              <div className="comparison-row">
                <span>-</span>
                <strong>No campaigns yet</strong>
                <small>Send a campaign to compare performance</small>
              </div>
            )}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Failed Delivery Reasons</h3>
          </div>
          <div className="failed-reason-list">
            {failedDeliveryReasons.map((item) => (
              <div className="failed-reason-row" key={item.reason}>
                <span>{item.reason}</span>
                <strong>{item.count}</strong>
                <div>
                  <i style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-grid-main">
        <div className="analytics-panel span-2">
          <div className="analytics-panel-header">
            <div>
              <h3>Campaign Performance Trends</h3>
              <p>{dateRange} comparison across sends, opens, and clicks</p>
            </div>
          </div>
          <div className="analytics-chart-large">
            <Line data={data.performanceTrend} options={chartOptions} />
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h3>Email Engagement Distribution</h3>
              <p>Opened, clicked, bounced, and unopened volume</p>
            </div>
          </div>
          <div className="analytics-chart-medium doughnut-frame">
            <Doughnut data={data.engagementDistribution} options={doughnutOptions} />
            <div className="doughnut-center">
              <span>Total</span>
              <strong>100%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h3>Campaign Read vs Unread</h3>
            <p>Opened/read count compared with unread recipients by campaign</p>
          </div>
        </div>
        <div className="analytics-chart-medium">
          <Bar data={data.readUnreadByCampaign || fallbackAnalytics.readUnreadByCampaign} options={chartOptions} />
        </div>
      </div>

      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h3>Top Performing Campaigns</h3>
            <p>Sorted by engagement strength and revenue contribution</p>
          </div>
        </div>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Sent</th>
                <th>Read/Open</th>
                <th>Unread</th>
                <th>Open Rate</th>
                <th>CTR</th>
                <th>Bounce</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns?.map((campaign) => (
                <tr key={campaign.id || campaign.name}>
                  <td className="campaign-name">{campaign.name}</td>
                  <td>{formatNumber(campaign.sent)}</td>
                  <td className="positive-cell">{formatNumber(getCampaignReadCount(campaign))}</td>
                  <td>{formatNumber(getCampaignUnreadCount(campaign))}</td>
                  <td className="positive-cell">{Number(campaign.openRate || 0).toFixed(1)}%</td>
                  <td>{Number(campaign.ctr || 0).toFixed(1)}%</td>
                  <td className={Number(campaign.bounceRate || 0) > 5 ? "negative-cell" : ""}>
                    {Number(campaign.bounceRate || 0).toFixed(1)}%
                  </td>
                  <td>{formatCurrency(campaign.revenue)}</td>
                  <td>
                    <span className="status-badge">{campaign.status}</span>
                  </td>
                </tr>
              ))}
              {!data.campaigns?.length && (
                <tr>
                  <td colSpan="9">No sent campaigns in this range yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <div>
            <h3>Recipient-Level Tracking</h3>
            <p>Per-recipient read, click, bounce, and delivery state from tracked campaign emails</p>
          </div>
        </div>
        <div className="stats-grid role-stats-grid">
          {[
            ["Sent", data.recipientEngagement?.totals?.sent || data.kpis?.totalEmailsSent || 0],
            ["Read/Open", data.recipientEngagement?.totals?.read || 0],
            ["Unread", data.recipientEngagement?.totals?.unread || 0],
            ["Clicked", data.recipientEngagement?.totals?.clicked || 0],
          ].map(([label, value]) => (
            <div className="card" key={label}>
              <h3>{label}</h3>
              <p>{formatNumber(value)}</p>
              <span>Recipient-level</span>
            </div>
          ))}
        </div>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Status</th>
                <th>Read</th>
                <th>Clicked</th>
                <th>Opens</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {(data.recipientEngagement?.recent || []).map((recipient) => (
                <tr key={recipient.id || recipient.email}>
                  <td className="campaign-name">{recipient.email}</td>
                  <td>{recipient.status}</td>
                  <td>{recipient.read ? "Yes" : "No"}</td>
                  <td>{recipient.clicked ? "Yes" : "No"}</td>
                  <td>{formatNumber(recipient.opens)}</td>
                  <td>{formatNumber(recipient.clicks)}</td>
                </tr>
              ))}
              {!data.recipientEngagement?.recent?.length && (
                <tr>
                  <td colSpan="6">Send a new tracked campaign to see recipient-level data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-three">
        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Open Rate Performance</h3>
          </div>
          <div className="analytics-chart-small">
            <Bar data={data.openRateTrend} options={chartOptions} />
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>CTR Trend</h3>
          </div>
          <div className="analytics-chart-small">
            <Line data={data.ctrTrend} options={chartOptions} />
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Bounce Monitoring</h3>
          </div>
          <div className="analytics-chart-small">
            <Bar
              data={data.bounceBreakdown}
              options={{
                ...chartOptions,
                indexAxis: "y",
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="analytics-three">
        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Audience Insights</h3>
          </div>
          <div className="audience-grid">
            {data.audienceInsights?.map((item) => (
              <div className="audience-item" key={item.label} style={{ borderColor: item.color }}>
                <span>{item.label}</span>
                <strong style={{ color: item.color }}>{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Regional Concentration</h3>
          </div>
          <div className="region-list">
            {data.regions?.map((region) => (
              <div className="region-row" key={region.city}>
                <div>
                  <FaMapMarkerAlt />
                  <span>{region.city}</span>
                </div>
                <strong>{region.share}%</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Device Usage</h3>
          </div>
          <div className="analytics-chart-small">
            <Pie data={data.deviceUsage} options={{ ...doughnutOptions, cutout: "0%" }} />
          </div>
        </div>
      </div>

      <div className="analytics-three">
        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Automation Performance</h3>
          </div>
          <div className="automation-list">
            {data.automationPerformance?.map((item) => (
              <div className="automation-item" key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.value)}</strong>
                </div>
                <div className="automation-track">
                  <span
                    style={{
                      width: `${Math.min((Number(item.value || 0) / Number(item.max || 1)) * 100, 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="analytics-feed">
            {data.activities?.slice(0, 5).map((activity) => (
              <div className="analytics-feed-item" key={activity.id || activity.text}>
                <span className="feed-icon" style={{ color: activity.color }}>
                  <FaBolt />
                </span>
                <div>
                  <p>{activity.text}</p>
                  <small>{activity.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel">
          <div className="analytics-panel-header">
            <h3>Priority Notifications</h3>
          </div>
          <div className="analytics-feed">
            {data.notifications?.slice(0, 5).map((notification) => (
              <div className="analytics-feed-item" key={notification.id || notification.title}>
                <span className={notification.read ? "feed-icon" : "feed-icon unread-feed-icon"}>
                  <FaBell />
                </span>
                <div>
                  <p>{notification.title}</p>
                  <small>{notification.time || notification.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
