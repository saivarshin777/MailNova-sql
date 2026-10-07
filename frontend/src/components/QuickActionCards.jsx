import {
  FaBell,
  FaChartLine,
  FaEnvelope,
  FaMagic,
  FaProjectDiagram,
  FaUserPlus,
} from "react-icons/fa";

const actions = [
  {
    title: "Create Campaign",
    detail: "Plan audience, template, timing, and send setup.",
    icon: FaEnvelope,
    accent: "#2563eb",
    action: "compose",
  },
  {
    title: "Add Contact",
    detail: "Add a lead or customer to the audience.",
    icon: FaUserPlus,
    accent: "#14b8a6",
    action: "contact",
  },
  {
    title: "Build Workflow",
    detail: "Create an automated follow-up journey.",
    icon: FaProjectDiagram,
    accent: "#7c3aed",
    action: "automations",
  },
  {
    title: "Optimization Review",
    detail: "Improve subject, content, timing, and spam score.",
    icon: FaMagic,
    accent: "#d97706",
    action: "ai",
  },
  {
    title: "Analytics Report",
    detail: "Compare campaigns and export performance.",
    icon: FaChartLine,
    accent: "#0f766e",
    action: "analytics",
  },
  {
    title: "Notification Center",
    detail: "Review alerts, unread items, and platform health.",
    icon: FaBell,
    accent: "#ef4444",
    action: "notifications",
  },
];

function QuickActionCards({ setActivePage, openCompose, openAddContact }) {
  const runAction = (action) => {
    if (action === "compose" || action === "ai") {
      openCompose();
      return;
    }

    if (action === "contact") {
      openAddContact();
      return;
    }

    if (action === "automations") {
      setActivePage("Automations");
      return;
    }

    if (action === "analytics") {
      setActivePage("Analytics");
      return;
    }

    if (action === "notifications") {
      setActivePage("Notifications");
    }
  };

  return (
    <section className="quick-actions-grid" aria-label="Quick actions">
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button type="button" className="quick-action-card" key={item.title} onClick={() => runAction(item.action)}>
            <span style={{ color: item.accent, background: `${item.accent}18` }}>
              <Icon />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </button>
        );
      })}
    </section>
  );
}

export default QuickActionCards;
