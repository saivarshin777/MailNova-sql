import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function ChannelChart() {

  const data = {
    labels: [
      "Email",
      "WhatsApp",
      "SMS",
      "Automation",
      "Others"
    ],

    datasets: [
      {
        data: [
          71.8,
          11.5,
          7.7,
          5.1,
          3.9
        ],

        backgroundColor: [
          "#0f766e",
          "#10b981",
          "#2563eb",
          "#d97706",
          "#94a3b8"
        ],

        borderWidth: 2,
        cutout: "65%",
      }
    ]
  };

  return (
    <div className="chart-box">

      <div className="chart-toolbar compact">
        <div>
          <h3>Channel Mix</h3>
          <p>Campaign distribution across delivery channels.</p>
        </div>
      </div>

      <div className="channel-chart-wrapper">

        <Doughnut data={data} />

        {/* center text */}
        <div className="chart-center-text">
          <h3>156</h3>
          <p>Total Campaigns</p>
        </div>

      </div>

    </div>
  );
}

export default ChannelChart;
