import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaEnvelope,
  FaUsers,
  FaChartBar,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaCrown,
  FaPalette,
  FaProjectDiagram,
  FaClipboardList,
  FaCreditCard,
  FaExternalLinkAlt,
  FaServer,
  FaShieldAlt,
  FaSlidersH,
  FaUserShield,
} from "react-icons/fa";
import { clearSession } from "./utils/auth.js";

function Sidebar({ activePage, setActivePage, open: propOpen, setOpen: propSetOpen }) {
  const [localOpen, setLocalOpen] = useState(true);
  const open = propOpen !== undefined ? propOpen : localOpen;
  const setOpen = propSetOpen !== undefined ? propSetOpen : setLocalOpen;
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <FaHome /> },
    { name: "Campaigns", icon: <FaEnvelope /> },
    { name: "Templates", icon: <FaPalette /> },
    { name: "Contacts", icon: <FaUsers /> },
    { name: "Automations", icon: <FaProjectDiagram /> },
    { name: "Analytics", icon: <FaChartBar /> },
    { name: "Notifications", icon: <FaBell /> },
    { name: "Users", icon: <FaUserShield /> },
    { name: "Plans", icon: <FaCreditCard /> },
    { name: "Monitoring", icon: <FaServer /> },
    { name: "System Logs", icon: <FaClipboardList /> },
    { name: "Security", icon: <FaShieldAlt /> },
    { name: "Platform Settings", icon: <FaSlidersH /> },
    { name: "User Workspace", icon: <FaExternalLinkAlt /> },
    { name: "Settings", icon: <FaCog /> },
    { name: "Logout", icon: <FaSignOutAlt /> },
  ];

  const handleMenuClick = (itemName) => {
    if (itemName === "User Workspace") {
      navigate("/dashboard");
      return;
    }

    if (itemName === "Logout") {
      clearSession();
      navigate("/login");
    } else {
      setActivePage(itemName);
    }
  };

  return (
    <div className={open ? "sidebar" : "sidebar collapsed"}>
      <div className="top-section">
        <h2>
          Mail<span>Nova</span>
        </h2>

        <FaBars
          className="menu-icon"
          onClick={() => setOpen(!open)}
        />
      </div>

      <ul>
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={activePage === item.name ? "active" : ""}
            onClick={() => handleMenuClick(item.name)}
          >
            {item.icon}
            {open && item.name}
          </li>
        ))}
      </ul>

      {open && (
        <div className="upgrade-box">
          <FaCrown
            style={{
              fontSize: "22px",
              marginBottom: "8px",
            }}
          />

          <h4>Workspace Plan</h4>
          <p>Plan usage, deliverability, and workspace controls</p>

          <button onClick={() => handleMenuClick("Plans")}>Open Billing</button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
