function EmailUsage({ usage }) {
  const percentage = usage?.percentage ?? 64;
  const monthlyLimit = usage?.monthlyLimit ?? 200000;
  const used = usage?.used ?? 128456;
  const remaining = usage?.remaining ?? 71544;

  return (
    <div className="chart-box">
      <div className="chart-toolbar compact">
        <div>
          <h3>Email Usage</h3>
          <p>Monthly sending limit and remaining capacity.</p>
        </div>
      </div>

      <div className="email-circle">
        <svg width="160" height="160">
          <circle
            cx="80"
            cy="80"
            r="65"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />

          <circle
            cx="80"
            cy="80"
            r="65"
            stroke="#0f766e"
            strokeWidth="12"
            fill="none"
            strokeDasharray="408"
            strokeDashoffset={408 - (408 * percentage) / 100}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </svg>

        <div className="circle-text">
          <h2>{percentage}%</h2>
          <p>{used.toLocaleString()} used</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "30px",
          textAlign: "center",
        }}
      >
        <div>
          <h3 style={{ color: "#0f766e" }}>{Math.round(monthlyLimit / 1000)}K</h3>
          <p>Monthly Limit</p>
        </div>

        <div>
          <h3 style={{ color: "#22c55e" }}>{Math.round(used / 1000)}K</h3>
          <p>Used</p>
        </div>

        <div>
          <h3 style={{ color: "#f97316" }}>{Math.round(remaining / 1000)}K</h3>
          <p>Remaining</p>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span>Usage Progress</span>
          <strong>{percentage}%</strong>
        </div>

        <div
          style={{
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              background: "#0f766e",
              borderRadius: "10px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default EmailUsage;
