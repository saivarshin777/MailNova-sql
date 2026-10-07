import { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaBolt,
  FaChartBar,
  FaCog,
  FaEnvelope,
  FaHome,
  FaPalette,
  FaPlus,
  FaProjectDiagram,
  FaSearch,
  FaServer,
  FaShieldAlt,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";

const iconById = {
  dashboard: FaHome,
  campaigns: FaEnvelope,
  compose: FaPlus,
  templates: FaPalette,
  contacts: FaUsers,
  addContact: FaPlus,
  automations: FaProjectDiagram,
  analytics: FaChartBar,
  notifications: FaBell,
  users: FaUserShield,
  plans: FaUsers,
  monitoring: FaServer,
  logs: FaShieldAlt,
  security: FaShieldAlt,
  platformSettings: FaCog,
  settings: FaCog,
};

function CommandPalette({ open, onClose, setActivePage, openCompose, openAddContact }) {
  const [query, setQuery] = useState("");

  const commands = useMemo(
    () => [
      { id: "dashboard", label: "Open Dashboard", hint: "Executive overview", run: () => setActivePage("Dashboard") },
      { id: "campaigns", label: "Open Campaigns", hint: "Search and manage campaigns", run: () => setActivePage("Campaigns") },
      { id: "compose", label: "Create Campaign", hint: "Launch the smart campaign wizard", run: openCompose },
      { id: "templates", label: "Open Templates", hint: "Edit reusable email templates", run: () => setActivePage("Templates") },
      { id: "contacts", label: "Open Contacts", hint: "Audience folders and segmentation", run: () => setActivePage("Contacts") },
      { id: "addContact", label: "Add Contact", hint: "Create a new contact record", run: openAddContact },
      { id: "automations", label: "Open Automations", hint: "Workflow builder", run: () => setActivePage("Automations") },
      { id: "analytics", label: "Open Analytics", hint: "Performance intelligence", run: () => setActivePage("Analytics") },
      { id: "notifications", label: "Open Notifications", hint: "Alerts and system health", run: () => setActivePage("Notifications") },
      { id: "users", label: "Manage Users", hint: "Roles, status, and account access", run: () => setActivePage("Users") },
      { id: "plans", label: "Open Plans", hint: "Plan limits and subscription status", run: () => setActivePage("Plans") },
      { id: "monitoring", label: "Open Monitoring", hint: "SMTP, queues, failures, and API health", run: () => setActivePage("Monitoring") },
      { id: "logs", label: "Open System Logs", hint: "Audit trail and admin actions", run: () => setActivePage("System Logs") },
      { id: "security", label: "Open Security", hint: "Permissions and role boundaries", run: () => setActivePage("Security") },
      { id: "platformSettings", label: "Open Platform Settings", hint: "Global SMTP, domain, and app settings", run: () => setActivePage("Platform Settings") },
      { id: "settings", label: "Open Settings", hint: "Profile, access, security", run: () => setActivePage("Settings") },
    ],
    [openAddContact, openCompose, setActivePage]
  );

  const filteredCommands = commands.filter((command) =>
    `${command.label} ${command.hint}`.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="command-palette" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-search">
          <FaSearch />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actions, pages, campaigns..."
          />
          <span>Esc</span>
        </div>

        <div className="command-list">
          {filteredCommands.length ? (
            filteredCommands.map((command) => {
              const Icon = iconById[command.id] || FaBolt;
              return (
                <button
                  type="button"
                  key={command.id}
                  onClick={() => {
                    command.run();
                    onClose();
                  }}
                >
                  <span>
                    <Icon />
                  </span>
                  <div>
                    <strong>{command.label}</strong>
                    <small>{command.hint}</small>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="empty-state compact-empty">
              <strong>No matching action</strong>
              <p>Try searching for campaigns, contacts, analytics, or settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
