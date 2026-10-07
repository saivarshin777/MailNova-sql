import { useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);

function PerformanceChart({ data }) {

  const [filter, setFilter] = useState("Last 7 Days");

  const fallbackChartData = {
    "Last 7 Days": {
      labels: [
        "20 May",
        "21 May",
        "22 May",
        "23 May",
        "24 May",
        "25 May",
        "26 May"
      ],

      datasets: [
        {
          label: "Emails Sent",
          data: [18000, 22000, 26000, 30000, 34000, 38000, 42456],
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.1)",
          tension: 0.4
        },

        {
          label: "Delivered",
          data: [13000, 16000, 19000, 22500, 25000, 28500, 31567],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.4
        },

        {
          label: "Opened",
          data: [7000, 9000, 11000, 13000, 15000, 17500, 19000],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          tension: 0.4
        },

        {
          label: "Clicked",
          data: [1200, 1800, 2500, 3200, 4000, 4800, 5500],
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          tension: 0.4
        }
      ]
    },

    "Last 30 Days": {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],

      datasets: [
        {
          label: "Emails Sent",
          data: [80000, 95000, 110000, 130000],
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.1)",
          tension: 0.4
        },

        {
          label: "Delivered",
          data: [65000, 76000, 90000, 110000],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.4
        },

        {
          label: "Opened",
          data: [32000, 40000, 52000, 61000],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          tension: 0.4
        },

        {
          label: "Clicked",
          data: [8000, 10000, 13000, 17000],
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          tension: 0.4
        }
      ]
    },

    "Last 6 Months": {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],

      datasets: [
        {
          label: "Emails Sent",
          data: [200000, 260000, 300000, 350000, 420000, 500000],
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.1)",
          tension: 0.4
        },

        {
          label: "Delivered",
          data: [160000, 210000, 250000, 300000, 360000, 420000],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.4
        },

        {
          label: "Opened",
          data: [90000, 120000, 150000, 180000, 210000, 250000],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          tension: 0.4
        },

        {
          label: "Clicked",
          data: [25000, 32000, 40000, 47000, 53000, 65000],
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          tension: 0.4
        }
      ]
    },

    "Last 1 Year": {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ],

      datasets: [
        {
          label: "Emails Sent",
          data: [
            100000,
            130000,
            160000,
            190000,
            220000,
            260000,
            300000,
            350000,
            400000,
            450000,
            500000,
            560000
          ],

          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.1)",
          tension: 0.4
        },

        {
          label: "Delivered",
          data: [
            80000,
            110000,
            135000,
            160000,
            190000,
            220000,
            260000,
            300000,
            340000,
            390000,
            430000,
            500000
          ],

          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.08)",
          tension: 0.4
        },

        {
          label: "Opened",
          data: [
            40000,
            52000,
            70000,
            85000,
            100000,
            120000,
            145000,
            170000,
            190000,
            220000,
            250000,
            290000
          ],

          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          tension: 0.4
        },

        {
          label: "Clicked",
          data: [
            10000,
            15000,
            19000,
            24000,
            30000,
            38000,
            45000,
            52000,
            60000,
            70000,
            80000,
            92000
          ],

          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          tension: 0.4
        }
      ]
    }
  };

  const emptyChartData = {
    "Last 7 Days": {
      labels: [],
      datasets: ["Emails Sent", "Delivered", "Opened", "Clicked"].map((label) => ({
        label,
        data: [],
        borderColor: "#94a3b8",
        backgroundColor: "rgba(148, 163, 184, 0.08)",
        tension: 0.4,
      })),
    },
    "Last 30 Days": { labels: [], datasets: [] },
    "Last 6 Months": { labels: [], datasets: [] },
    "Last 1 Year": { labels: [], datasets: [] },
  };

  const chartData = data || emptyChartData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          color: "#475569",
          padding: 18,
        },
      },

      tooltip: {
        enabled: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
        ticks: {
          color: "#64748b",
        },
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 5,
      },
      line: {
        borderWidth: 2.5,
      },
    },
  };

  return (
    <div className="chart-box">

      <div className="chart-toolbar">
        <div>
          <h3>Email Performance</h3>
          <p>Send volume, delivery, opens, and clicks by period.</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontWeight: "600",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 6 Months</option>
          <option>Last 1 Year</option>
        </select>

      </div>

      <div className="chart-canvas">
        <Line
          data={chartData[filter] || chartData["Last 7 Days"]}
          options={options}
        />
      </div>

    </div>
  );
}

export default PerformanceChart;
