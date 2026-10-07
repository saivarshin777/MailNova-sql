import {
  FiMail,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";

function ProgressSection() {
  return (
    <div className="progress-section">

      <div className="progress-card">
        <div className="progress-header">
          <div className="icon-box email-icon">
            <FiMail />
          </div>

          <div>
            <h3>Email Campaign Success</h3>
            <p>Performance this month</p>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill fill1"></div>
        </div>

        <span className="progress-value">
          85%
        </span>
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <div className="icon-box users-icon">
            <FiUsers />
          </div>

          <div>
            <h3>Customer Engagement</h3>
            <p>Audience interaction</p>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill fill2"></div>
        </div>

        <span className="progress-value">
          72%
        </span>
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <div className="icon-box revenue-icon">
            <FiTrendingUp />
          </div>

          <div>
            <h3>Revenue Growth</h3>
            <p>Compared to last month</p>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill fill3"></div>
        </div>

        <span className="progress-value">
          91%
        </span>
      </div>

    </div>
  );
}

export default ProgressSection;