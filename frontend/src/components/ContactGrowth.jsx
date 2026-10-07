import { useMemo, useState } from "react";

const chartData = {
  "This Month": [
    { day: "1", contacts: 800 },
    { day: "5", contacts: 1400 },
    { day: "10", contacts: 2200 },
    { day: "15", contacts: 1800 },
    { day: "20", contacts: 2600 },
    { day: "25", contacts: 2100 },
    { day: "30", contacts: 3000 },
  ],
  "Last Month": [
    { day: "1", contacts: 600 },
    { day: "5", contacts: 1200 },
    { day: "10", contacts: 1800 },
    { day: "15", contacts: 1600 },
    { day: "20", contacts: 2100 },
    { day: "25", contacts: 1900 },
    { day: "30", contacts: 2500 },
  ],
  "Last 6 Months": [
    { day: "Jan", contacts: 8000 },
    { day: "Feb", contacts: 11000 },
    { day: "Mar", contacts: 14000 },
    { day: "Apr", contacts: 17000 },
    { day: "May", contacts: 21000 },
    { day: "Jun", contacts: 24860 },
  ],
  "This Year": [
    { day: "Jan", contacts: 5000 },
    { day: "Feb", contacts: 7000 },
    { day: "Mar", contacts: 10000 },
    { day: "Apr", contacts: 13000 },
    { day: "May", contacts: 16000 },
    { day: "Jun", contacts: 19000 },
    { day: "Jul", contacts: 22000 },
    { day: "Aug", contacts: 24860 },
  ],
};

function ContactGrowth() {
  const [filter, setFilter] = useState("This Month");

  const summary = useMemo(() => {
    const data = chartData[filter];
    const maxContacts = Math.max(...data.map((item) => item.contacts), 1);
    const latest = data[data.length - 1]?.contacts ?? 0;
    const previous = data[data.length - 2]?.contacts ?? latest;
    const growth = previous ? Math.round(((latest - previous) / previous) * 100) : 0;

    return { data, maxContacts, latest, growth };
  }, [filter]);

  return (
    <section className="chart-box contact-growth-card">
      <div className="contact-growth-header">
        <div>
          <h3>Contact Growth</h3>
          <h2>{summary.latest.toLocaleString()}</h2>
          <p className={summary.growth >= 0 ? "positive" : "negative"}>
            {summary.growth >= 0 ? "+" : ""}
            {summary.growth}% vs previous period
          </p>
        </div>

        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          {Object.keys(chartData).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div
        className="contact-growth-chart"
        role="img"
        aria-label={`Contact growth chart for ${filter}`}
      >
        {summary.data.map((item) => {
          const height = Math.max((item.contacts / summary.maxContacts) * 100, 8);

          return (
            <div className="contact-growth-column" key={`${filter}-${item.day}`}>
              <div className="contact-growth-track">
                <div className="contact-growth-fill" style={{ height: `${height}%` }}>
                  <span>{item.contacts.toLocaleString()}</span>
                </div>
              </div>
              <small>{item.day}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ContactGrowth;
