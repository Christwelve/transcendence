import React, { useState, useEffect } from "react";
import styles from "./Statistics.module.scss";

const Statistics = () => {
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [winRate, setWinRate] = useState(33);
  const [wins, setWins] = useState(531);
  const [losses, setLosses] = useState(32);
  const [totalGoalsScored, setTotalGoalsScored] = useState(400);
  const [totalGoalsReceived, setTotalGoalsReceived] = useState(200);

  useEffect(() => {
    if (!isStatisticsOpen) {
      setIsMatchHistoryOpen(false);
    }
  }, [isStatisticsOpen]);

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
          <div>
            <h3>User data Overview:</h3>
            <p>WINRATE: {winRate}</p>
            <p>WINS: {wins}</p>
            <p>LOSSES: {losses}</p>
            <p>Total goals scored: {totalGoalsScored}</p>
            <p>Total goals received: {totalGoalsReceived}</p>
          </div>
          <button
            className={`${styles.matchHistory__box__toggle} ${
              isMatchHistoryOpen ? styles.statistics__close : ""
            }`}
            onClick={() => setIsMatchHistoryOpen((prev) => !prev)}
          >
            {isMatchHistoryOpen ? "Close Match History" : "View Match History"}
          </button>
          {isMatchHistoryOpen && (
            <div className={styles.matchHistory__box}>
              <h3>Match History</h3>
              {/* Add match history content here */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Statistics;