import React, { useState, useEffect } from "react";
import styles from "./Statistics.module.scss";
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function Statistics() {
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [isChartBoxOpen, setIsChartBoxOpen] = useState(false);
  const [winRate, setWinRate] = useState(0);
  const [totalGoalsScored, setTotalGoalsScored] = useState(400);
  const [totalGoalsReceived, setTotalGoalsReceived] = useState(200);
  const [userData, setUserData] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
  const [userStatistics, setUserStatistics] = useState(null);

  const mockMatchHistory = [
    { matchId: 1, goalsScored: 5, goalsReceived: 3 },
    { matchId: 2, goalsScored: 2, goalsReceived: 4 },
    { matchId: 3, goalsScored: 6, goalsReceived: 6 },
    { matchId: 4, goalsScored: 5, goalsReceived: 7 },
    // Add more match data as needed
  ];

  useEffect(() => {
    fetch("http://localhost:8000/api/user/data/", {
      method: "GET",
      credentials: "include", // Ensure cookies are sent with the request
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        return response.json();
      })
      .then((data) => {
        setUserData(data); // Store user data

        // Fetch full user data using the username from the first response
        return fetch(`http://localhost:8000/api/users/${data.username}/`, {
          method: "GET",
          credentials: "include",
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch full user data");
        }
        return response.json();
      })
      .then((fullData) => {
        setFullUserData(fullData); // Store full user data
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });

    // Fetch user statistics
    fetch("http://localhost:8000/api/user/statistics/", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user statistics");
        }
        return response.json();
      })
      .then((statistics) => {
        setUserStatistics(statistics); // Store user statistics
      })
      .catch((error) => {
        console.error("Error fetching user statistics:", error);
      });
  }, []);

  useEffect(() => {
    if (fullUserData) {
      const { wins, losses } = fullUserData;
      const totalGames = wins + losses;
      const calculatedWinRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
      setWinRate(calculatedWinRate.toFixed(2));
    }
  }, [fullUserData]);

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
            <h3>User Data Overview:</h3>
            <pre>{JSON.stringify(userData, null, 2)}</pre>
            {fullUserData ? (
              <>
                <p>Name: {fullUserData.username}</p>
                <p>WINRATE: {winRate}%</p>
                <p>WINS: {fullUserData.wins}</p>
                <p>LOSSES: {fullUserData.losses}</p>
                <p>Total goals scored: {totalGoalsScored}</p>
                <p>Total goals received: {totalGoalsReceived}</p>
                <p>Average goals scored: {averageGoalsScored.toFixed(2)}</p>
                <p>Average goals received: {averageGoalsReceived.toFixed(2)}</p>
              </>
            ) : (
              <p>Loading full user data...</p>
            )}
            <h3>User Statistics:</h3>
            <pre>{JSON.stringify(userStatistics, null, 2)}</pre>
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