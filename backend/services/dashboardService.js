const safeNumber = (value) => {
  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").replace(/%/g, "").trim() : value;
  return Number.isFinite(Number(normalized)) ? Number(normalized) : 0;
};

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getId = (document) => String(document._id || document.id || "");

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const openRate = (campaign) =>
  campaign.emailsSent ? Math.round((campaign.opened / campaign.emailsSent) * 100) : 0;

const unreadCount = (campaign) =>
  Math.max(safeNumber(campaign.delivered || campaign.emailsSent) - safeNumber(campaign.opened), 0);

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const isCountableCampaign = (campaign) => {
  const status = String(campaign.status || "").toLowerCase();
  const sendStatus = String(campaign.sendStatus || "").toLowerCase();

  if (status === "draft" || sendStatus === "draft") return false;
  if (status === "failed" || sendStatus === "failed") return false;
  if (sendStatus === "pending") return false;

  return (
    sendStatus === "sent" ||
    status === "completed" ||
    status === "active" ||
    safeNumber(campaign.emailsSent) > 0
  );
};

export const toClientCampaign = (campaign) => {
  const recipients = Array.isArray(campaign.recipients)
    ? campaign.recipients
    : Array.isArray(campaign.to)
    ? campaign.to
    : String(campaign.recipients || campaign.to || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

  const name = firstValue(
    campaign.name,
    campaign.campaignName,
    campaign.campaign_name,
    campaign.title,
    campaign.campaignTitle,
    "Untitled Campaign"
  );
  const subject = firstValue(campaign.subject, campaign.emailSubject, campaign.mailSubject, name);
  const rawStatus = firstValue(campaign.status, campaign.campaignStatus, "");
  const sendStatus = firstValue(campaign.sendStatus, campaign.emailStatus, rawStatus);
  const normalizedSendStatus = String(sendStatus || "").toLowerCase();
  const status =
    rawStatus ||
    (normalizedSendStatus === "draft"
      ? "Draft"
      : normalizedSendStatus === "sent"
      ? "Completed"
      : normalizedSendStatus === "failed"
      ? "Failed"
      : "Running");
  const recipientCount = safeNumber(campaign.recipientCount) || recipients.length;
  const emailsSent =
    safeNumber(
      firstValue(
        campaign.emailsSent,
        campaign.mailsSent,
        campaign.emails_sent,
        campaign.sent,
        campaign.sentCount,
        campaign.totalEmailsSent,
        campaign.totalSent
      )
    ) || recipientCount;
  const delivered =
    safeNumber(
      firstValue(campaign.delivered, campaign.deliveredCount, campaign.deliveryCount, campaign.deliveredEmails)
    ) ||
    (safeNumber(firstValue(campaign.deliveryRate, campaign.deliveredRate)) && emailsSent
      ? Math.round((emailsSent * safeNumber(firstValue(campaign.deliveryRate, campaign.deliveredRate))) / 100)
      : 0) ||
    (normalizedSendStatus === "sent" ? emailsSent : 0);
  const openRateValue = safeNumber(firstValue(campaign.openRate, campaign.open_rate, campaign.opensRate));
  const clickRateValue = safeNumber(firstValue(campaign.clickRate, campaign.click_rate, campaign.clicksRate));
  const rawOpened =
    safeNumber(firstValue(campaign.opened, campaign.opens, campaign.openCount, campaign.openedEmails)) ||
    (openRateValue && emailsSent ? Math.round((emailsSent * openRateValue) / 100) : 0);
  const rawClicked =
    safeNumber(firstValue(campaign.clicked, campaign.clicks, campaign.clickCount, campaign.clickedEmails)) ||
    (clickRateValue && emailsSent ? Math.round((emailsSent * clickRateValue) / 100) : 0);
  const maxEngagement = Math.max(emailsSent, delivered, rawOpened, rawClicked, 0);
  const clicked = maxEngagement ? Math.min(rawClicked, maxEngagement) : rawClicked;
  const opened = maxEngagement ? Math.min(Math.max(rawOpened, clicked), maxEngagement) : Math.max(rawOpened, clicked);
  const shouldCount = isCountableCampaign({
    status,
    sendStatus,
    emailsSent,
  });

  return {
    id: getId(campaign),
    name,
    subject,
    content: firstValue(campaign.content, campaign.body, campaign.message, ""),
    recipients,
    htmlContent: firstValue(campaign.htmlContent, campaign.html, ""),
    textContent: firstValue(campaign.textContent, campaign.text, ""),
    templateId: campaign.template ? String(campaign.template) : "",
    templateName: firstValue(campaign.templateName, ""),
    owner: campaign.createdBy
      ? {
          id: String(campaign.createdBy._id || campaign.createdBy),
          name: campaign.createdBy.name || "Unknown owner",
          email: campaign.createdBy.email || "",
          role: campaign.createdBy.role || "",
        }
      : null,
    contactListId: campaign.contactList ? String(campaign.contactList) : "",
    contactListName: firstValue(campaign.contactListName, ""),
    sendStatus,
    sendError: firstValue(campaign.sendError, campaign.error, ""),
    status,
    emailsSent: shouldCount ? emailsSent : 0,
    delivered: shouldCount ? delivered : 0,
    opened: shouldCount ? opened : 0,
    clicked: shouldCount ? clicked : 0,
    unread: shouldCount ? unreadCount({ delivered, emailsSent, opened }) : 0,
    createdAt: firstValue(campaign.createdAt, campaign.created_at, campaign.date, new Date()),
  };
};

const notificationDescription = (notification) => {
  const title = firstValue(notification.title, notification.heading, notification.name, "");
  const desc = firstValue(notification.desc, notification.description, notification.message, notification.content, "");
  const normalizedTitle = String(title).toLowerCase();
  const normalizedDesc = String(desc);

  if (normalizedTitle.includes("sms") && normalizedDesc.includes(": \"")) {
    const target = normalizedDesc.match(/SMS to ([^:]+):/i)?.[1] || "the selected contact";
    return `SMS delivery recorded for ${target}.`;
  }

  return desc;
};

export const toClientNotification = (notification) => ({
  id: getId(notification),
  type: firstValue(notification.type, notification.category, "system"),
  title: firstValue(notification.title, notification.heading, notification.name, "Notification"),
  desc: notificationDescription(notification),
  time: firstValue(notification.time, notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Just now"),
  read: toBoolean(firstValue(notification.read, notification.isRead, false)),
  createdAt: firstValue(notification.createdAt, notification.created_at, new Date()),
});

const makeActivity = (campaigns) =>
  [...campaigns]
    .filter(isCountableCampaign)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .flatMap((campaign) => [
      {
        id: `${campaign.id}-sent`,
        text: `Email campaign "${campaign.name}" delivered to ${formatNumber(campaign.delivered)} contacts`,
        time: new Date(campaign.createdAt).toLocaleDateString(),
        color: "#2563eb",
        kind: "sent",
      },
      {
        id: `${campaign.id}-open`,
        text: `${campaign.name} open rate is ${openRate(campaign)}%`,
        time: new Date(campaign.createdAt).toLocaleDateString(),
        color: "#16a34a",
        kind: "open",
      },
    ])
    .slice(0, 8);

const makeChart = (campaigns) => {
  const byDay = new Map();

  [...campaigns]
    .filter(isCountableCampaign)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((campaign) => {
      const date = new Date(campaign.createdAt);
      const key = Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toISOString().slice(0, 10);
      const current =
        byDay.get(key) || {
          label:
            key === "Unknown"
              ? "Unknown"
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
          emailsSent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          unread: 0,
        };

      current.emailsSent += safeNumber(campaign.emailsSent);
      current.delivered += safeNumber(campaign.delivered);
      current.opened += safeNumber(campaign.opened);
      current.clicked += safeNumber(campaign.clicked);
      current.unread += unreadCount(campaign);
      byDay.set(key, current);
    });

  const recent = [...byDay.values()].slice(-12);
  const labels = recent.map((day) => day.label);

  return {
    labels,
    datasets: [
      {
        label: "Total Emails Sent",
        data: recent.map((day) => day.emailsSent),
        borderColor: "#4f46e5",
        tension: 0.4,
      },
      {
        label: "Delivered",
        data: recent.map((day) => day.delivered),
        borderColor: "#2563eb",
        tension: 0.4,
      },
      {
        label: "Opened",
        data: recent.map((day) => day.opened),
        borderColor: "#10b981",
        tension: 0.4,
      },
      {
        label: "Clicked",
        data: recent.map((day) => day.clicked),
        borderColor: "#f59e0b",
        tension: 0.4,
      },
      {
        label: "Unread",
        data: recent.map((day) => day.unread),
        borderColor: "#64748b",
        tension: 0.4,
      },
    ],
  };
};

const percent = (value, total) => (total ? Number(((value / total) * 100).toFixed(1)) : 0);

const makeTrendChart = (campaigns) => {
  const byDay = new Map();

  [...campaigns]
    .filter(isCountableCampaign)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((campaign) => {
      const date = new Date(campaign.createdAt);
      const key = Number.isNaN(date.getTime()) ? "Unknown" : date.toISOString().slice(0, 10);
      const current =
        byDay.get(key) || {
          label:
            key === "Unknown"
              ? "Unknown"
              : date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
          sent: 0,
          opened: 0,
          clicked: 0,
          delivered: 0,
          unread: 0,
        };

      current.sent += safeNumber(campaign.emailsSent);
      current.opened += safeNumber(campaign.opened);
      current.clicked += safeNumber(campaign.clicked);
      current.delivered += safeNumber(campaign.delivered);
      current.unread += unreadCount(campaign);
      byDay.set(key, current);
    });

  const recent = [...byDay.values()].slice(-10);

  return {
    labels: recent.map((day) => day.label),
    datasets: [
      {
        label: "Emails Sent",
        data: recent.map((day) => day.sent),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Opened",
        data: recent.map((day) => day.opened),
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.08)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Clicked",
        data: recent.map((day) => day.clicked),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.08)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Unread",
        data: recent.map((day) => day.unread),
        borderColor: "#64748b",
        backgroundColor: "rgba(100, 116, 139, 0.08)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

const makeMonthlyRates = (campaigns, metric) => {
  const byMonth = new Map();

  [...campaigns].filter(isCountableCampaign).forEach((campaign) => {
    const date = new Date(campaign.createdAt);
    const key = Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleDateString("en-US", { month: "short" });
    const current = byMonth.get(key) || { sent: 0, opened: 0, clicked: 0 };
    current.sent += safeNumber(campaign.emailsSent);
    current.opened += safeNumber(campaign.opened);
    current.clicked += safeNumber(campaign.clicked);
    byMonth.set(key, current);
  });

  const rows = [...byMonth.entries()].slice(-6);

  return {
    labels: rows.map(([label]) => label),
    datasets: [
      {
        label: metric === "click" ? "CTR %" : "Open Rate %",
        data: rows.map(([, month]) =>
          metric === "click" ? percent(month.clicked, month.sent) : percent(month.opened, month.sent)
        ),
        backgroundColor: "rgba(37, 99, 235, 0.78)",
        borderColor: "#2563eb",
        borderRadius: 8,
        tension: 0.4,
      },
    ],
  };
};

const makeCityBreakdown = (contacts) => {
  const counts = new Map();
  contacts.forEach((contact) => {
    const city = contact.city || "Unknown";
    counts.set(city, (counts.get(city) || 0) + 1);
  });

  const total = contacts.length || 1;
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({
      city,
      contacts: count,
      share: percent(count, total),
    }));

  return rows;
};

export const buildDashboard = (campaignDocuments, notificationDocuments) => {
  const campaigns = campaignDocuments.map(toClientCampaign);
  const sentCampaigns = campaigns.filter(isCountableCampaign);
  const notifications = notificationDocuments.map(toClientNotification);
  const totals = sentCampaigns.reduce(
    (acc, campaign) => ({
      emailsSent: acc.emailsSent + safeNumber(campaign.emailsSent),
      delivered: acc.delivered + safeNumber(campaign.delivered),
      opened: acc.opened + safeNumber(campaign.opened),
      clicked: acc.clicked + safeNumber(campaign.clicked),
    }),
    { emailsSent: 0, delivered: 0, opened: 0, clicked: 0 }
  );

  const monthlyLimit = Math.max(200000, Math.ceil(totals.emailsSent / 50000) * 50000);
  const chart = makeChart(sentCampaigns);

  return {
    campaigns,
    topCampaigns: [...sentCampaigns].sort((a, b) => openRate(b) - openRate(a)),
    recentActivity: makeActivity(sentCampaigns),
    performance: {
      "Last 7 Days": chart,
      "Last 30 Days": chart,
      "Last 6 Months": chart,
      "Last 1 Year": chart,
    },
    emailUsage: {
      monthlyLimit,
      used: totals.emailsSent,
      remaining: Math.max(monthlyLimit - totals.emailsSent, 0),
      percentage: Math.min(Math.round((totals.emailsSent / monthlyLimit) * 100), 100),
    },
    metrics: {
      openRate: totals.emailsSent ? ((totals.opened / totals.emailsSent) * 100).toFixed(1) : "0.0",
      clickRate: totals.emailsSent ? ((totals.clicked / totals.emailsSent) * 100).toFixed(1) : "0.0",
      deliveryRate: totals.emailsSent ? ((totals.delivered / totals.emailsSent) * 100).toFixed(1) : "0.0",
      bounceRate: totals.emailsSent ? (100 - (totals.delivered / totals.emailsSent) * 100).toFixed(1) : "0.0",
    },
    stats: {
      totalEmailsSent: totals.emailsSent,
      delivered: totals.delivered,
      openRate: totals.emailsSent ? ((totals.opened / totals.emailsSent) * 100).toFixed(1) : "0.0",
      drafts: campaigns.filter((campaign) => campaign.status === "Draft" || campaign.sendStatus === "draft").length,
      totalCampaigns: sentCampaigns.length,
    },
    notificationsSummary: {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      read: notifications.filter((notification) => notification.read).length,
      campaignAlerts: notifications.filter((notification) => notification.type === "campaign").length,
      systemUpdates: notifications.filter((notification) => notification.type === "system").length,
    },
  };
};

export const buildAnalytics = (campaignDocuments, contactDocuments = [], notificationDocuments = [], recipientDocuments = []) => {
  const campaigns = campaignDocuments.map(toClientCampaign);
  const sentCampaigns = campaigns.filter(isCountableCampaign);
  const notifications = notificationDocuments.map(toClientNotification);
  const contacts = contactDocuments || [];
  const recipientRows = recipientDocuments || [];

  const totals = sentCampaigns.reduce(
    (acc, campaign) => ({
      emailsSent: acc.emailsSent + safeNumber(campaign.emailsSent),
      delivered: acc.delivered + safeNumber(campaign.delivered),
      opened: acc.opened + safeNumber(campaign.opened),
      clicked: acc.clicked + safeNumber(campaign.clicked),
    }),
    { emailsSent: 0, delivered: 0, opened: 0, clicked: 0 }
  );

  const bounces = Math.max(totals.emailsSent - totals.delivered, 0);
  const activeContacts = contacts.filter((contact) =>
    ["Customer", "Prospect"].includes(contact.status)
  ).length;
  const newSubscribers = contacts.filter((contact) => {
    if (!contact.createdAt) return false;
    return new Date(contact.createdAt).getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).length;
  const conversionRate = percent(totals.clicked, Math.max(totals.opened, 1));
  const estimatedRevenue = Math.round(totals.clicked * 3.6 + activeContacts * 8);
  const recipientTotals = recipientRows.reduce(
    (acc, row) => ({
      sent: acc.sent + (["sent", "bounced", "unsubscribed"].includes(row.status) ? 1 : 0),
      read: acc.read + (row.openedAt ? 1 : 0),
      clicked: acc.clicked + (row.clickedAt ? 1 : 0),
      bounced: acc.bounced + (row.status === "bounced" ? 1 : 0),
    }),
    { sent: 0, read: 0, clicked: 0, bounced: 0 }
  );
  const recentRecipients = [];
  const seenRecipientEmails = new Set();
  for (const row of recipientRows) {
    const email = String(row.email || "").toLowerCase();
    if (!email || seenRecipientEmails.has(email)) continue;
    seenRecipientEmails.add(email);
    recentRecipients.push(row);
    if (recentRecipients.length >= 12) break;
  }

  const topCampaigns = [...sentCampaigns]
    .sort((a, b) => openRate(b) - openRate(a))
    .slice(0, 8)
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      sent: campaign.emailsSent,
      opened: campaign.opened,
      clicked: campaign.clicked,
      unread: unreadCount(campaign),
      openRate: openRate(campaign),
      ctr: percent(campaign.clicked, campaign.emailsSent),
      bounceRate: percent(Math.max(campaign.emailsSent - campaign.delivered, 0), campaign.emailsSent),
      revenue: Math.round(campaign.clicked * 3.6),
      status: campaign.status,
    }));

  const recentActivity = makeActivity(sentCampaigns).map((activity) => ({
    ...activity,
    icon: activity.kind === "open" ? "Trend" : "Mail",
  }));

  return {
    kpis: {
      totalEmailsSent: totals.emailsSent,
      openRate: percent(totals.opened, totals.emailsSent),
      ctr: percent(totals.clicked, totals.emailsSent),
      bounceRate: percent(bounces, totals.emailsSent),
      conversionRate,
      revenue: estimatedRevenue,
    },
    executiveSummary: [
      {
        label: "Audience Quality",
        value: `${percent(activeContacts, contacts.length || activeContacts || 1)}%`,
        detail: `${formatNumber(activeContacts)} active contacts`,
      },
      {
        label: "Subscriber Growth",
        value: formatCompact(newSubscribers),
        detail: "new contacts in the last 30 days",
      },
      {
        label: "Campaign Velocity",
        value: formatCompact(sentCampaigns.length),
        detail: "sent or active campaigns",
      },
    ],
    performanceTrend: makeTrendChart(sentCampaigns),
    engagementDistribution: {
      labels: ["Opened", "Clicked", "Bounced", "Unopened"],
      datasets: [
        {
          data: [
            totals.opened,
            totals.clicked,
            bounces,
            Math.max(totals.delivered - totals.opened, 0),
          ],
          backgroundColor: ["#14b8a6", "#f59e0b", "#ef4444", "#64748b"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    readUnreadByCampaign: {
      labels: topCampaigns.map((campaign) => campaign.name),
      datasets: [
        {
          label: "Read/Open",
          data: topCampaigns.map((campaign) => campaign.opened),
          backgroundColor: "rgba(20, 184, 166, 0.82)",
          borderRadius: 8,
        },
        {
          label: "Unread",
          data: topCampaigns.map((campaign) => campaign.unread),
          backgroundColor: "rgba(100, 116, 139, 0.72)",
          borderRadius: 8,
        },
      ],
    },
    recipientEngagement: {
      totals: {
        sent: recipientTotals.sent || totals.emailsSent,
        read: recipientTotals.read || totals.opened,
        unread: Math.max((recipientTotals.sent || totals.delivered || totals.emailsSent) - (recipientTotals.read || totals.opened), 0),
        clicked: recipientTotals.clicked || totals.clicked,
        bounced: recipientTotals.bounced || bounces,
      },
      recent: recentRecipients.map((row) => ({
        id: String(row._id || row.id || row.email),
        email: row.email,
        status: row.status,
        read: Boolean(row.openedAt),
        clicked: Boolean(row.clickedAt),
        opens: row.opens || 0,
        clicks: row.clicks || 0,
        lastEventAt: row.lastEventAt || row.updatedAt || row.createdAt,
      })),
    },
    openRateTrend: makeMonthlyRates(sentCampaigns, "open"),
    ctrTrend: makeMonthlyRates(sentCampaigns, "click"),
    bounceBreakdown: {
      labels: ["Hard Bounce", "Soft Bounce", "Invalid Email", "Blocked Domain"],
      datasets: [
        {
          label: "Bounce %",
          data: [
            Number((percent(bounces, totals.emailsSent) * 0.38).toFixed(1)),
            Number((percent(bounces, totals.emailsSent) * 0.32).toFixed(1)),
            Number((percent(bounces, totals.emailsSent) * 0.2).toFixed(1)),
            Number((percent(bounces, totals.emailsSent) * 0.1).toFixed(1)),
          ],
          backgroundColor: ["#ef4444", "#f59e0b", "#8b5cf6", "#2563eb"],
          borderRadius: 8,
        },
      ],
    },
    deviceUsage: {
      labels: ["Desktop", "Mobile", "Tablet"],
      datasets: [
        {
          data: [47, 44, 9],
          backgroundColor: ["#2563eb", "#14b8a6", "#f59e0b"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    audienceInsights: [
      { label: "New Subscribers", value: newSubscribers, color: "#2563eb" },
      { label: "Returning", value: activeContacts, color: "#14b8a6" },
      {
        label: "Unsubscribed",
        value: contacts.filter((contact) => contact.status === "Inactive").length,
        color: "#ef4444",
      },
      { label: "Active Contacts", value: activeContacts, color: "#f59e0b" },
    ],
    regions: makeCityBreakdown(contacts),
    automationPerformance: [
      { label: "Workflows Executed", value: sentCampaigns.length * 2, max: Math.max(sentCampaigns.length * 2, 1), color: "#2563eb" },
      { label: "Emails Triggered", value: totals.emailsSent, max: Math.max(totals.emailsSent, 1), color: "#f59e0b" },
      { label: "Successful Deliveries", value: totals.delivered, max: Math.max(totals.emailsSent, 1), color: "#14b8a6" },
      { label: "Estimated Revenue", value: estimatedRevenue, max: Math.max(estimatedRevenue, 1), color: "#ef4444" },
    ],
    failedDeliveryReasons: bounces
      ? [
          { reason: "Estimated hard bounce", count: Math.round(bounces * 0.38), share: 38 },
          { reason: "Estimated soft bounce", count: Math.round(bounces * 0.32), share: 32 },
          { reason: "Invalid or inactive email", count: Math.round(bounces * 0.2), share: 20 },
          { reason: "Blocked or temporary provider issue", count: Math.max(bounces - Math.round(bounces * 0.9), 0), share: 10 },
        ]
      : [],
    campaigns: topCampaigns,
    activities: recentActivity,
    notifications: notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6),
  };
};

export const createCampaignMetrics = (payload) => {
  const emailsSent = safeNumber(payload.emailsSent);
  const delivered = safeNumber(payload.delivered);
  const opened = safeNumber(payload.opened);
  const clicked = safeNumber(payload.clicked);

  return {
    emailsSent,
    delivered,
    opened,
    clicked,
  };
};
