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

    fetchUserStatistics();
  }, []);

  const fetchUserStatistics = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user/statistics/", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user statistics");
      }
      const statistics = await response.json();
      setUserStatistics(statistics); // Store user statistics
      const totalGoalsScored = statistics.statistics.reduce((acc, stat) => acc + stat.goals_scored, 0);
      const totalGoalsReceived = statistics.statistics.reduce((acc, stat) => acc + stat.goals_received, 0);

      setTotalGoalsScored(totalGoalsScored);
      setTotalGoalsReceived(totalGoalsReceived);
    } catch (error) {
      console.error("Error fetching user statistics:", error);
    }
  };

  useEffect(() => {
    if (fullUserData) {
      const { wins, losses } = fullUserData;
      const totalGames = wins + losses;
      const calculatedWinRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
      setWinRate(calculatedWinRate.toFixed(2));
    }
  }, [fullUserData]);

  const getLastFiveMatches = (statistics) => {
    return statistics.slice(-5).map(stat => ({
      match: stat.match,
      isWin: stat.goals_scored > stat.goals_received,
      isDraw: stat.goals_scored === stat.goals_received
    }));
  };

  const lastFiveMatches = userStatistics ? getLastFiveMatches(userStatistics.statistics) : [];

  const chartData = {
    labels: userStatistics ? userStatistics.statistics.map(stat => `Match ${stat.match}`) : [],
    datasets: [
      {
        label: 'Goals Scored',
        data: userStatistics ? userStatistics.statistics.map(stat => stat.goals_scored) : [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Goals Received',
        data: userStatistics ? userStatistics.statistics.map(stat => stat.goals_received) : [],
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
            {/* <pre>{JSON.stringify(userData, null, 2)}</pre> */}
            {fullUserData ? (
              <>
                <p>Name: {fullUserData.username}</p>
                <p>WINRATE: {winRate}%</p>
                <p>WINS: {fullUserData.wins}</p>
                <p>LOSSES: {fullUserData.losses}</p>
                <p>Total goals scored: {totalGoalsScored || 0}</p>
                <p>Total goals received: {totalGoalsReceived || 0}</p>              </>
            ) : (
              <p>Loading full user data...</p>
            )}
            {/* <h3>User Statistics:</h3> */}
            {/* <pre>{JSON.stringify(userStatistics, null, 2)}</pre> */}
          </div>
          <div className={styles.lastFiveMatches}>
            <h3>Last 5 Matches</h3>
            <div className={styles.bars}>
              {lastFiveMatches.map((match, index) => (
                <div
                  key={index}
                  className={`${styles.bar} ${match.isWin ? styles.win : match.isDraw ? styles.draw : styles.loss}`}
                  />
              ))}
            </div>
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
                  {userStatistics.statistics.map((match) => (
                    <li key={match.match} className={styles.list}>
                      <p>Match ID: {match.match}</p>
                      <p>Goals Scored: {match.goals_scored}</p>
                      <p>Goals Received: {match.goals_received}</p>
                      <p
                        className={`${styles.result} ${match.goals_scored > match.goals_received
                            ? styles.win
                            : match.goals_scored < match.goals_received
                              ? styles.loss
                              : styles.draw}`}
                      >
                        Result:{" "}
                        {match.goals_scored > match.goals_received
                          ? "Win"
                          : match.goals_scored < match.goals_received
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