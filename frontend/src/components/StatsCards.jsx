import {
  FaEnvelope,
  FaCheckCircle,
  FaFolderOpen,
  FaDollarSign,
} from "react-icons/fa";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

function StatsCards({ stats }) {
  return (
    <div className="cards">

      <div className="card blue">
        <h3>
          <FaEnvelope
            style={{
              marginRight: "8px",
              color: "#0f766e",
            }}
          />
          Emails Sent
        </h3>

        <p>{formatNumber(stats?.totalEmailsSent ?? 0)}</p>
        <span>{formatNumber(stats?.totalCampaigns ?? 0)} campaigns</span>
      </div>

      <div className="card green">
        <h3>
          <FaCheckCircle
            style={{
              marginRight: "8px",
              color: "#16a34a",
            }}
          />
          Delivered
        </h3>

        <p>{formatNumber(stats?.delivered ?? 0)}</p>
        <span>Confirmed deliveries</span>
      </div>

      <div className="card purple">
        <h3>
          <FaFolderOpen
            style={{
              marginRight: "8px",
              color: "#0ea5e9",
            }}
          />
          Open Rate
        </h3>

        <p>{stats?.openRate ?? "0.0"}%</p>
        <span>Average engagement</span>
      </div>

      <div className="card orange">
        <h3>
          <FaDollarSign
            style={{
              marginRight: "8px",
              color: "#d97706",
            }}
          />
          Drafts
        </h3>

        <p>{formatNumber(stats?.drafts ?? 0)}</p>
        <span>Campaigns in progress</span>
      </div>

    </div>
  );
}

export default StatsCards;
