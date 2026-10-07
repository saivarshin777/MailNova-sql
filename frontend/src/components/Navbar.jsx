import { FaBell, FaMoon, FaSearch, FaSun } from "react-icons/fa";
import { displayUserName, displayUserTitle, getStoredUser, userInitials } from "../utils/auth.js";

function Navbar({
  darkMode,
  setDarkMode,
  campaignSearch,
  setCampaignSearch,
  onCampaignSearch,
  onNotificationsClick,
  unreadNotifications = 0,
}) {
  const user = getStoredUser();

  return (
    <>
      <form
        className="navbar"
        onSubmit={onCampaignSearch}
      >
        <div
          style={{
            position: "relative",
            width: "320px",
          }}
        >
          <FaSearch
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />

          <input
            type="text"
            placeholder="Search campaigns..."
            value={campaignSearch}
            onChange={(event) => setCampaignSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCampaignSearch(event);
              }
            }}
            style={{
              width: "100%",
              paddingLeft: "42px",
            }}
          />
        </div>

        <div className="nav-right">
          <div className="icon-box notification-nav-icon" onClick={onNotificationsClick}>
            <FaBell />
            {unreadNotifications > 0 && (
              <span className="notification-nav-badge">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </div>

          <div
            className="icon-box"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </div>

          <div className="profile">
            <div className="profile-avatar" aria-hidden="true">
              {userInitials(user)}
            </div>

            <div>
              <h4>
                {displayUserName(user)}
              </h4>
              <p>{displayUserTitle(user)}</p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default Navbar;
