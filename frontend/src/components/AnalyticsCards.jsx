import {
  FiUsers,
  FiMousePointer,
  FiTrendingDown,
  FiUserPlus,
} from "react-icons/fi";

function AnalyticsCards() {
  return (
    <div className="analytics-grid">

      <div className="analytics-card">
        <div className="analytics-icon reach">
          <FiUsers />
        </div>

        <h3>
          Campaign Reach
        </h3>

        <p>1.2M Users</p>

        <span
          style={{
            color: "#0f766e",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          +12% this month
        </span>
      </div>

      <div className="analytics-card">
        <div className="analytics-icon click">
          <FiMousePointer />
        </div>

        <h3>
          Click Rate
        </h3>

        <p>78%</p>

        <span
          style={{
            color: "#2563eb",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          +8% improvement
        </span>
      </div>

      <div className="analytics-card">
        <div className="analytics-icon bounce">
          <FiTrendingDown />
        </div>

        <h3>
          Bounce Rate
        </h3>

        <p>12%</p>

        <span
          style={{
            color: "#d97706",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          Lower than last week
        </span>
      </div>

      <div className="analytics-card">
        <div className="analytics-icon sub">
          <FiUserPlus />
        </div>

        <h3>
          Subscribers
        </h3>

        <p>89,450</p>

        <span
          style={{
            color: "#0f766e",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          +2,350 new users
        </span>
      </div>

    </div>
  );
}

export default AnalyticsCards;
