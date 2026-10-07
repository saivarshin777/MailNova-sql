export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// The backend computes isOwner dynamically from OWNER_EMAIL and returns it on
// every login/session response. Trust that field instead of duplicating a
// protected-owner email comparison in the browser.
export const isOwnerUser = (user) => Boolean(user?.isOwner);

export const getHomeRoute = (role) => {
  if (role === "Admin") return "/admin";
  return "/dashboard";
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedInUser");
};

export const roleLabel = (role) => {
  if (role === "Admin") return "Admin";
  if (role === "Manager") return "Manager";
  return "User";
};

export const displayUserName = (user) => user?.name || (user?.role === "Admin" ? "Admin" : "MailNova User");

export const displayUserTitle = (user) => {
  if (user?.role === "Admin") return isOwnerUser(user) ? "Owner Admin" : "Platform Admin";
  return `${roleLabel(user?.role)} (${user?.plan?.name || "Free"} - ${(user?.plan?.sendLimit || 5000).toLocaleString()} Credits)`;
};

export const userInitials = (user) => {
  const name = displayUserName(user);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MN";
};
