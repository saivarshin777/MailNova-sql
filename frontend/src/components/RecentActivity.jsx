function RecentActivity() {
  return (
    <div className="activity">

      <h2>Recent Campaigns</h2>

      <table>
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Status</th>
            <th>Clicks</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Summer Sale</td>
            <td>Active</td>
            <td>1,245</td>
          </tr>

          <tr>
            <td>Product Launch</td>
            <td>Completed</td>
            <td>2,890</td>
          </tr>

          <tr>
            <td>Festival Offer</td>
            <td>Paused</td>
            <td>945</td>
          </tr>
        </tbody>

      </table>
    </div>
  );
}

export default RecentActivity;
