// src/components/ScoreHeader.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Play, Pause, RefreshCw } from 'lucide-react';
// import { getOvers } from '../services/api';

const ScoreHeader = React.memo(({
  matchConfig,
  teams,
  striker,
  setStriker,
  nonStriker,
  setNonStriker,
  bowler,
  setBowler,
  totalRuns,
  wickets,
  currentOver,
  currentBall,
  onOverChange
}) => {
  const team1 = teams.team1;
  const team2 = teams.team2;

  const [overs, setOvers] = useState([]);
  const [currentOverIndex, setCurrentOverIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get batsmen from the batting team based on toss decision
  const getBattingTeam = useCallback(() => {
    if (matchConfig.currentInnings === 1) {
      return matchConfig.tossDecision === 'bat' ? 
        (matchConfig.tossWinner === 'team1' ? team1 : team2) :
        (matchConfig.tossWinner === 'team1' ? team2 : team1);
    } else {
      return matchConfig.currentInnings === 2 ?
        (matchConfig.tossDecision === 'bat' ? 
          (matchConfig.tossWinner === 'team1' ? team2 : team1) :
          (matchConfig.tossWinner === 'team1' ? team1 : team2)) : team1;
    }
  }, [matchConfig.currentInnings, matchConfig.tossDecision, matchConfig.tossWinner, team1, team2]);

  // Get bowling team
  const getBowlingTeam = useCallback(() => {
    const battingTeam = getBattingTeam();
    return battingTeam.id === team1.id ? team2 : team1;
  }, [getBattingTeam, team1, team2]);

  const battingTeam = getBattingTeam();
  const bowlingTeam = getBowlingTeam();

  const batsmen = battingTeam.players?.filter(p => 
    p.role === 'batsman' || p.role === 'allrounder' || p.role === 'wicketkeeper'
  ) || [];

  const bowlers = bowlingTeam.players?.filter(p => 
    p.role === 'bowler' || p.role === 'allrounder'
  ) || [];

  // Fetch overs data - memoized
  const fetchOvers = useCallback(async () => {
    if (!matchConfig.id) return;
    
    setIsLoading(true);
    try {
      // const response = await getOvers(matchConfig.id);
      // const oversData = response.data.results || response.data || [];
      const oversData = []; // Mock data for now
      setOvers(oversData);
      
      // Set current over index based on current over number
      const currentIndex = oversData.findIndex(over => over.over_number === currentOver);
      if (currentIndex !== -1) {
        setCurrentOverIndex(currentIndex);
      }
    } catch (error) {
      console.error('Error fetching overs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchConfig.id, currentOver]);

  useEffect(() => {
    fetchOvers();
    // Set up automatic refresh every 10 seconds
    const intervalId = setInterval(fetchOvers, 10000);
    return () => clearInterval(intervalId);
  }, [fetchOvers]);

  const getTossInfo = useCallback(() => {
    if (!matchConfig.tossWinner || !matchConfig.tossDecision) return '';
    
    const tossWinnerTeam = matchConfig.tossWinner === 'team1' ? team1 : team2;
    return `${tossWinnerTeam.name} won toss, chose to ${matchConfig.tossDecision}`;
  }, [matchConfig.tossWinner, matchConfig.tossDecision, team1, team2]);

  const calculateRunRate = useCallback(() => {
    const totalBalls = (Math.max(0, currentOver - 1)) * 6 + currentBall;
    if (totalBalls === 0) return '0.00';
    return ((totalRuns / totalBalls) * 6).toFixed(2);
  }, [currentOver, currentBall, totalRuns]);

  const calculateRequiredRunRate = useCallback(() => {
    const totalBalls = matchConfig.overs * 6;
    const ballsRemaining = totalBalls - ((currentOver - 1) * 6 + currentBall);
    if (ballsRemaining <= 0) return '0.00';
    return ((totalRuns / ballsRemaining) * 6).toFixed(2);
  }, [currentOver, currentBall, totalRuns, matchConfig.overs]);

  const getBatsmanInfo = useCallback((batsmanName) => {
    const batsman = batsmen.find(p => 
      p.display_name === batsmanName || `${p.fname} ${p.lname}` === batsmanName
    );
    if (!batsman) return '';
    
    const handed = batsman.left_handed ? 'Left-handed' : 'Right-handed';
    return `${handed} ${batsman.role}`;
  }, [batsmen]);

  const getBowlerInfo = useCallback((bowlerName) => {
    const bowlerInfo = bowlers.find(p => 
      p.display_name === bowlerName || `${p.fname} ${p.lname}` === bowlerName
    );
    if (!bowlerInfo) return '';
    
    const bowlerType = bowlerInfo.bowler_type ? 
      `${bowlerInfo.bowler_type.charAt(0).toUpperCase() + bowlerInfo.bowler_type.slice(1)}` : '';
    return `${bowlerType} ${bowlerInfo.role}`.trim();
  }, [bowlers]);

  // Function to handle automatic player switching
  const handlePlayerSwitch = useCallback((runs, isOverComplete = false) => {
    if (!striker || !nonStriker) return;

    // Switch players for odd runs or when over is complete
    if ((runs % 2 === 1) || isOverComplete) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }
  }, [striker, nonStriker, setStriker, setNonStriker]);

  const handlePreviousOver = useCallback(() => {
    if (currentOver > 1) {
      const prevOver = currentOver - 1;
      if (onOverChange) {
        onOverChange(prevOver, 0);
      }
    }
  }, [currentOver, onOverChange]);

  const handleNextOver = useCallback(() => {
    if (currentOver < matchConfig.overs) {
      const nextOver = currentOver + 1;
      if (onOverChange) {
        onOverChange(nextOver, 0);
      }
      // Switch players at the end of the over
      handlePlayerSwitch(0, true);
    }
  }, [currentOver, matchConfig.overs, onOverChange, handlePlayerSwitch]);

  const getOverSummary = useCallback((over) => {
    if (!over) return '0';
    // If API provided aggregate runs, use it. Otherwise compute from balls data.
    if (typeof over.runs === 'number') return String(over.runs);
    const balls = over.balls || [];
    const total = balls.reduce((sum, b) => {
      if (!b) return sum;
      // If wicket, runs may be 0 but still count as 0; handle null/undefined
      const r = typeof b.runs === 'number' ? b.runs : 0;
      return sum + r;
    }, 0);
    return String(total);
  }, []);

  const getCurrentOverBalls = useCallback(() => {
    const currentOverData = overs[currentOverIndex] || null;
    const ballsData = currentOverData?.balls || [];

    // Determine how many balls have been bowled for this over.
    // If this is the live/current over, use currentBall; otherwise use recorded balls length.
    const ballsBowled = (currentOverData && currentOverData.over_number === currentOver)
      ? currentBall
      : ballsData.length;

    // Create an array of 6 slots for the over
    return Array.from({ length: 6 }, (_, i) => {
      // If this ball hasn't been bowled yet in the current over, return empty (runs: null)
      if (i >= ballsBowled) {
        return {
          ball_number: i + 1,
          runs: null,
          is_wicket: false
        };
      }

      // If we have actual data, use it
      if (ballsData[i]) {
        return ballsData[i];
      }

      // Bowled but data not available -> show unknown (null) rather than 0
      return {
        ball_number: i + 1,
        runs: null,
        is_wicket: false
      };
    });
  }, [overs, currentOverIndex, currentOver, currentBall]);

  return (
    <div className="mb-6">
      {/* Main Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <h1 className="text-3xl font-bold text-gray-800">
              {battingTeam.name}
              {battingTeam.short_name && (
                <span className="text-lg text-gray-600 ml-2">({battingTeam.short_name})</span>
              )}
            </h1>
            <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-blue-800">Innings {matchConfig.currentInnings}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Striker Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Striker:</span>
              <select 
                value={striker} 
                onChange={(e) => setStriker(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-semibold bg-yellow-100 text-gray-800 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors min-w-[180px]"
              >
                <option value="">Select Striker</option>
                {batsmen.map(p => (
                  <option key={p.id} value={p.display_name || `${p.fname} ${p.lname}`}>
                    {p.display_name || `${p.fname} ${p.lname}`}
                    {p.jersey_number && ` (#${p.jersey_number})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Non-Striker:</span>
              <select 
                value={nonStriker} 
                onChange={(e) => setNonStriker(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-semibold bg-blue-100 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[180px]"
              >
                <option value="">Select Non-Striker</option>
                {batsmen.map(p => (
                  <option key={p.id} value={p.display_name || `${p.fname} ${p.lname}`}>
                    {p.display_name || `${p.fname} ${p.lname}`}
                    {p.jersey_number && ` (#${p.jersey_number})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button 
              onClick={() => {
                const temp = striker;
                setStriker(nonStriker);
                setNonStriker(temp);
              }}
              disabled={!striker || !nonStriker}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                !striker || !nonStriker
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-medium">Swap</span>
            </button>

            {/* Bowler Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Bowler:</span>
              <select 
                value={bowler} 
                onChange={(e) => setBowler(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 font-semibold bg-red-100 text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[180px]"
              >
                <option value="">Select Bowler</option>
                {bowlers.map(p => (
                  <option key={p.id} value={p.display_name || `${p.fname} ${p.lname}`}>
                    {p.display_name || `${p.fname} ${p.lname}`}
                    {p.jersey_number && ` (#${p.jersey_number})`}
                    {p.bowler_type && ` - ${p.bowler_type}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-right">
          <div className="text-5xl font-bold text-gray-800 mb-2">
            {totalRuns}<span className="text-2xl text-gray-600 mx-1">/</span>{wickets}
          </div>
          <div className="text-lg text-gray-600 font-semibold">
            {Math.max(0, currentOver - 1)}.{currentBall} <span className="text-gray-400">/ {matchConfig.overs} ov</span>
           
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {getTossInfo()}
          </div>
        </div>
      </div>

      {/* Enhanced Over Navigation */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Current Over Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePreviousOver}
                  disabled={currentOver <= 1}
                  className={`p-1.5 rounded-lg transition-all ${
                    currentOver <= 1
                      ? 'bg-blue-400 text-blue-200 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-white text-center">
                  <div className="text-xl font-bold">OVER {Math.max(0, currentOver - 1)}</div>
                  <div className="text-blue-200 text-sm">
                    Score: {totalRuns}/{wickets} ({Math.max(0, currentOver - 1)}.{currentBall})
                  </div>
                </div>

                <button 
                  onClick={handleNextOver}
                  disabled={currentOver >= matchConfig.overs}
                  className={`p-1.5 rounded-lg transition-all ${
                    currentOver >= matchConfig.overs
                      ? 'bg-blue-400 text-blue-200 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={fetchOvers}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>

            <div className="flex items-center space-x-6 text-white">
              {/* Run Rate */}
              <div className="text-center">
                <div className="text-sm text-blue-200">Current RR</div>
                <div className="text-xl font-bold">{calculateRunRate()}</div>
              </div>

              {/* Required Run Rate */}
              <div className="text-center">
                <div className="text-sm text-blue-200">Required RR</div>
                <div className="text-xl font-bold">{calculateRequiredRunRate()}</div>
              </div>

              {/* Projected Score */}
              <div className="text-center">
                <div className="text-sm text-blue-200">Projected</div>
                <div className="text-xl font-bold">
                  {Math.round(totalRuns * (matchConfig.overs * 6) / ((currentOver - 1) * 6 + currentBall)) || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Over Balls Display */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Current Over</h3>
            {overs[currentOverIndex] && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Runs in this over:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                  {getOverSummary(overs[currentOverIndex])}
                </span>
                <span className="ml-2 text-xs text-gray-500">(Over {overs[currentOverIndex]?.over_number})</span>
              </div>
            )}
          </div>

          {/* Balls Grid */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            {getCurrentOverBalls().map((ball, index) => {
              // determine class for ball
              const colorClass = ball.runs === null
                ? 'bg-white border-dashed border-gray-300 text-gray-700'
                : ball.is_wicket
                ? 'bg-red-500 text-white border-red-600'
                : (typeof ball.runs === 'number' && ball.runs >= 6)
                ? 'bg-green-600 text-white border-green-600'
                : (typeof ball.runs === 'number' && ball.runs >= 4)
                ? 'bg-green-500 text-white border-green-600'
                : (typeof ball.runs === 'number' && ball.runs > 0)
                ? 'bg-green-400 text-white border-green-600'
                : 'bg-gray-100 text-gray-700 border-gray-300';

              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${colorClass} ${index + 1 === currentBall ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  {ball.runs === null ? '' : ball.is_wicket ? 'W' : ball.runs}
                </div>
              );
            })}
          </div>

          {/* Previous Overs Summary */}
          {currentOver > 1 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Past Overs</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: currentOver - 1 }, (_, i) => i + 1).map((overNum) => (
                  <div
                    key={overNum}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      overNum === currentOver - 1 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'bg-gray-100 text-gray-700'
                    } cursor-pointer hover:bg-blue-50`}
                    onClick={() => {
                      if (onOverChange) {
                        onOverChange(overNum, 0);
                      }
                    }}
                  >
                    Over {overNum}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Info Bar */}
      <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
        {/* Striker Info */}
        {striker && (
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-semibold text-gray-800">🏏 {striker}</div>
              <div className="text-gray-600 text-xs">
                {getBatsmanInfo(striker)}
              </div>
            </div>
          </div>
        )}

        {/* Bowler Info */}
        {bowler && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <div className="font-semibold text-gray-800">🎯 {bowler}</div>
              <div className="text-gray-600 text-xs">
                {getBowlerInfo(bowler)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScoreHeader;