import {
  FiMail,
  FiGift,
  FiShoppingBag,
  FiArrowRight,
} from "react-icons/fi";

const icons = [FiMail, FiGift, FiShoppingBag];
const iconStyles = [
  { background: "#ecfdf5", color: "#0f766e" },
  { background: "#eff6ff", color: "#2563eb" },
  { background: "#fff7ed", color: "#d97706" },
];

function TopPerformers({ campaigns = [], showAll = false, onViewAll }) {
  const visibleCampaigns = showAll ? campaigns : campaigns.slice(0, 3);

  return (
    <div className="performers">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >

        <h3 style={{ margin: "0" }}>
          Top Performing Campaigns
        </h3>

        <button
          onClick={onViewAll}
          className="subtle-action-btn"
        >
          View All
          <FiArrowRight />
        </button>

      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >

        <thead>
          <tr>
            <th>Campaign</th>
            <th>Emails Sent</th>
            <th>Read/Open</th>
            <th>Unread</th>
            <th>Open Rate</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {visibleCampaigns.length === 0 && (
            <tr>
              <td colSpan="6">No campaigns found.</td>
            </tr>
          )}

          {visibleCampaigns.map((campaign, index) => {
            const Icon = icons[index % icons.length];
            const iconStyle = iconStyles[index % iconStyles.length];
            const openRate = campaign.emailsSent
              ? Math.round((campaign.opened / campaign.emailsSent) * 100)
              : 0;
            const readCount = Number(campaign.opened || 0);
            const unreadCount = Number(
              campaign.unread ?? Math.max((campaign.delivered || campaign.emailsSent || 0) - readCount, 0)
            );

            return (
          <tr key={campaign.id}>
            <td>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: iconStyle.background,
                    color: iconStyle.color,
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon />
                </div>

                {campaign.name}
              </div>
            </td>

            <td>{campaign.emailsSent.toLocaleString()}</td>

            <td>{readCount.toLocaleString()}</td>

            <td>{unreadCount.toLocaleString()}</td>

            <td
              style={{
                color: "#0f766e",
                fontWeight: "700",
              }}
            >
              {openRate}%
            </td>

            <td>
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#0f766e",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontWeight: "700",
                }}
              >
                {campaign.status}
              </span>
            </td>
          </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}

export default TopPerformers;
