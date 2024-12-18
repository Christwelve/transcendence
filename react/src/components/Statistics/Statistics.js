import React from "react";
import { useState } from "react";
import styles from "./Statistics.module.scss";

// const Statistics = () => {
//   return (
//     <div>
//       <h1>Statistics</h1>
//     </div>
//   );
// };

// export default Statistics;
const Statistics = () => {
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);

  return (
    <div
      className={`${styles.statistics} ${
        isStatisticsOpen ? styles.open : ""
      }`}
    >
      <button
        className={`${styles.statistics__toggle} ${
          isStatisticsOpen ? styles.statistics__close : ""
        }`}
        onClick={() => setIsStatisticsOpen((prev) => !prev)}
      >
        {isStatisticsOpen ? "Close Statistics" : "Open Statistics"}
      </button>
      {isStatisticsOpen && (
        <div className={styles.statistics__box}>
          <h2>Statistics</h2>
          <div>
            <h3>Data Overview:</h3>
            <p>Here is some filler text for the data overview section.</p>
          </div>
          <div>
            <h3>Detailed Analysis:</h3>
            <p>Here is some filler text for the detailed analysis section.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;