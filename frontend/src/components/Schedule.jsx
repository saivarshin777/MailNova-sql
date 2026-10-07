import {
  FiCalendar,
  FiMail,
  FiBarChart2,
  FiClock,
} from "react-icons/fi";

function Schedule() {
  return (
    <div className="schedule">

      <h2>
        Upcoming Schedule
      </h2>

      <div className="schedule-item">

        <div className="schedule-left">

          <div className="schedule-icon meeting">
            <FiCalendar />
          </div>

          <div>
            <h4>Team Meeting</h4>

            <p>
              Weekly planning discussion
            </p>
          </div>

        </div>

        <span className="schedule-time">
          <FiClock />
          10:00 AM
        </span>

      </div>

      <div className="schedule-item">

        <div className="schedule-left">

          <div className="schedule-icon campaign">
            <FiMail />
          </div>

          <div>
            <h4>Campaign Review</h4>

            <p>
              Review email performance
            </p>
          </div>

        </div>

        <span className="schedule-time">
          <FiClock />
          1:00 PM
        </span>

      </div>

      <div className="schedule-item">

        <div className="schedule-left">

          <div className="schedule-icon analytics">
            <FiBarChart2 />
          </div>

          <div>
            <h4>
              Analytics Presentation
            </h4>

            <p>
              Monthly dashboard report
            </p>
          </div>

        </div>

        <span className="schedule-time">
          <FiClock />
          4:00 PM
        </span>

      </div>

    </div>
  );
}

export default Schedule;
