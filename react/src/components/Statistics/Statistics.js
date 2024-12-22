import React, { useState, useEffect } from "react";
import styles from "./Statistics.module.scss";
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
// to do:
// 2. add list of players to match history elements
// 3.change mock data to real data from the server
function Statistics() {
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [isChartBoxOpen, setIsChartBoxOpen] = useState(false);
  const [winRate, setWinRate] = useState(33);
  const [wins, setWins] = useState(531);
  const [losses, setLosses] = useState(32);
  const [totalGoalsScored, setTotalGoalsScored] = useState(400);
  const [totalGoalsReceived, setTotalGoalsReceived] = useState(200);

  const mockMatchHistory = [
    { matchId: 1, goalsScored: 5, goalsReceived: 3 },
    { matchId: 2, goalsScored: 2, goalsReceived: 4 },
    { matchId: 3, goalsScored: 6, goalsReceived: 6 },
    { matchId: 4, goalsScored: 5, goalsReceived: 7 },
    // Add more match data as needed
  ];

  const averageGoalsScored = mockMatchHistory.reduce((acc, match) => acc + match.goalsScored, 0) / mockMatchHistory.length;
  const averageGoalsReceived = mockMatchHistory.reduce((acc, match) => acc + match.goalsReceived, 0) / mockMatchHistory.length;

  const chartData = {
    labels: mockMatchHistory.map(match => `Match ${match.matchId}`),
    datasets: [
      {
        label: 'Goals Scored',
        data: mockMatchHistory.map(match => match.goalsScored),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Goals Received',
        data: mockMatchHistory.map(match => match.goalsReceived),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  useEffect(() => {
    if (!isStatisticsOpen) {
      setIsMatchHistoryOpen(false);
      setIsChartBoxOpen(false);
    }
  }, [isStatisticsOpen]);

  return (
    <div className={`${styles.statistics} ${isStatisticsOpen ? styles.open : ""}`}>
      <button
        className={`${styles.statistics__toggle} ${isStatisticsOpen ? styles.statistics__close : ""}`}
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
            <p>Average goals scored: {averageGoalsScored.toFixed(2)}</p>
            <p>Average goals received: {averageGoalsReceived.toFixed(2)}</p>
          </div>
          <button
            className={`${styles.chartBox__toggle} ${isChartBoxOpen ? styles.statistics__close : ""}`}
            onClick={() => {
              setIsChartBoxOpen((prev) => !prev);
              setIsMatchHistoryOpen(false);
            }}
          >
            {isChartBoxOpen ? "Close Player Chart" : "View Player Chart"}
          </button>
          {isChartBoxOpen && (
            <div className={styles.chartBox}>
              <Line data={chartData} />
            </div>
          )}
          <button
            className={`${styles.matchHistory__box__toggle} ${isMatchHistoryOpen ? styles.statistics__close : ""}`}
            onClick={() => {
              setIsMatchHistoryOpen((prev) => !prev);
              setIsChartBoxOpen(false);
            }}
          >
            {isMatchHistoryOpen ? "Close Match History" : "View Match History"}
          </button>
          {isMatchHistoryOpen && (
            <div className={styles.matchHistory__box}>
              <div className={styles.matchHistory__box__content}>
                <h3>Match History</h3>
                <ul>
                  {mockMatchHistory.map((match) => (
                    <li key={match.matchId} className={styles.list}>
                      <p>Match ID: {match.matchId}</p>
                      <p>Goals Scored: {match.goalsScored}</p>
                      <p>Goals Received: {match.goalsReceived}</p>
                      <p
                        className={`${styles.result} ${match.goalsScored > match.goalsReceived
                            ? styles.win
                            : match.goalsScored < match.goalsReceived
                              ? styles.loss
                              : styles.draw}`}
                      >
                        Result:{" "}
                        {match.goalsScored > match.goalsReceived
                          ? "Win"
                          : match.goalsScored < match.goalsReceived
                            ? "Loss"
                            : "Draw"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Statistics;