// src/components/BallInputPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Target, Save, Check, ChevronRight, Users, RotateCcw, Zap } from 'lucide-react';
import Modal from './Modal';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const BallInputPanel = React.memo(({
  unsavedRuns,
  unsavedEvent,
  isSaved,
  onRunInput,
  onSaveBall,
  onNextBall,
  teams,
  striker,
  nonStriker,
  bowler,
  matchConfig,
  onPlayersUpdate,
  onEventInput,
  currentOver,
  currentBall
}) => {
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [inningsData, setInningsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableBatsmen, setAvailableBatsmen] = useState([]);
  const [availableBowlers, setAvailableBowlers] = useState([]);
  const [availableFielders, setAvailableFielders] = useState([]);
  const [selectedFielder, setSelectedFielder] = useState(null);
  const [selectedWicketType, setSelectedWicketType] = useState(null);

  const penaltyRunOptions = [
    { type: 'wide', label: 'Wide', runs: 1, event: 'wide' },
    { type: 'noball', label: 'No Ball', runs: 1, event: 'noball' },
    { type: 'bye', label: 'Bye', runs: 1, event: 'bye' },
    { type: 'legbye', label: 'Leg Bye', runs: 1, event: 'legbye' },
    { type: 'penalty', label: 'Penalty Runs', runs: 5, event: 'penalty' }
  ];

  const wicketTypes = [
    { type: 'bowled', label: 'Bowled', requiresFielder: false },
    { type: 'caught', label: 'Caught', requiresFielder: true },
    { type: 'lbw', label: 'LBW', requiresFielder: false },
    { type: 'run_out', label: 'Run Out', requiresFielder: true },
    { type: 'stumped', label: 'Stumped', requiresFielder: true },
    { type: 'hit_wicket', label: 'Hit Wicket', requiresFielder: false },
    { type: 'retired', label: 'Retired', requiresFielder: false }
  ];

  const fieldEvents = [
    { type: 'catch_taken', label: 'Catch Taken' },
    { type: 'catch_missed', label: 'Catch Missed' },
    { type: 'run_out_attempt', label: 'Run Out Attempt' },
    { type: 'stumping_attempt', label: 'Stumping Attempt' },
    { type: 'direct_hit', label: 'Direct Hit' },
    { type: 'good_fielding', label: 'Good Fielding' },
    { type: 'poor_fielding', label: 'Poor Fielding' }
  ];

  // Fetch innings data - memoized
  const fetchInningsData = useCallback(async () => {
    if (!matchConfig.id) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/innings/`, { params: { match_id: matchConfig.id } });
      const innings = response.data.results || response.data || [];
      
      if (innings.length > 0) {
        const currentInning = innings.find(inning => 
          inning.inning_number === matchConfig.currentInnings
        ) || innings[0];
        
        if (currentInning) {
          setInningsData(currentInning);
          updateAvailablePlayers(currentInning);
        }
      }
    } catch (error) {
      console.error('Error fetching innings data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matchConfig.id, matchConfig.currentInnings]);

  // Update available players from innings data - memoized
  const updateAvailablePlayers = useCallback((inningData) => {
    const battingTeamPlayers = Object.values(teams)?.find(team => 
      team.id === inningData.batting_team
    )?.players || [];

    const bowlingTeamPlayers = Object.values(teams)?.find(team => 
      team.id === inningData.bowling_team
    )?.players || [];

    if (inningData.batting_records) {
      const batsmen = inningData.batting_records.map(record => ({
        id: record.player,
        name: record.player_name,
        runs: record.runs,
        balls_faced: record.balls_faced,
        is_out: record.is_out
      })).filter(player => !player.is_out);
      
      setAvailableBatsmen(batsmen);
    }

    if (inningData.bowling_records) {
      const bowlers = inningData.bowling_records.map(record => ({
        id: record.player,
        name: record.player_name,
        overs_bowled: record.overs_bowled,
        wickets: record.wickets,
        economy_rate: record.economy_rate
      }));
      
      setAvailableBowlers(bowlers);
    }

    setAvailableFielders(bowlingTeamPlayers);
  }, [teams]);

  // Update players - memoized
  const handlePlayerChange = useCallback((type, playerName) => {
    if (onPlayersUpdate) {
      onPlayersUpdate({
        striker: type === 'striker' ? playerName : striker,
        nonStriker: type === 'nonStriker' ? playerName : nonStriker,
        bowler: type === 'bowler' ? playerName : bowler
      });
    }
  }, [onPlayersUpdate, striker, nonStriker, bowler]);

  // Swap batsmen - memoized
  const handleSwapBatsmen = useCallback(() => {
    if (onPlayersUpdate) {
      onPlayersUpdate({
        striker: nonStriker,
        nonStriker: striker,
        bowler: bowler
      });
    }
  }, [onPlayersUpdate, striker, nonStriker, bowler]);

  // Handle wicket with proper data structure - memoized
  const handleWicket = useCallback((wicketType, fielderId = null) => {
    if (onEventInput) {
      const wicketData = {
        ball_number: currentBall || 1,
        event: 'wicket',
        runs: 0,
        is_wicket: true,
        wicket_type: wicketType,
        fielder: fielderId,
        dismissed_batsman: striker,
        batsman: striker,
        is_extra: false
      };
      
      onEventInput(wicketData);
    }
    setShowWicketModal(false);
    setSelectedFielder(null);
    setSelectedWicketType(null);
  }, [onEventInput, currentBall, striker]);

  // Handle field event - memoized
  const handleFieldEvent = useCallback((eventType, fielderId = null) => {
    if (onEventInput) {
      const eventData = {
        ball_number: currentBall || 1,
        event: eventType,
        runs: 0,
        is_wicket: false,
        batsman: striker,
        is_extra: false
      };
      
      onEventInput(eventData);
    }
    setShowEventModal(false);
  }, [onEventInput, currentBall, striker]);

  // Handle normal run input with proper data structure - memoized
  const handleRunInput = useCallback((runs) => {
    let eventType = 'dot';
    
    if (runs === 0) eventType = 'dot';
    else if (runs === 1) eventType = 'single';
    else if (runs === 2) eventType = 'two';
    else if (runs === 3) eventType = 'three';
    else if (runs === 4) eventType = 'four';
    else if (runs === 5) eventType = 'five';
    else if (runs === 6) eventType = 'six';
    
    const runData = {
      ball_number: currentBall || 1,
      event: eventType,
      runs: runs,
      is_wicket: false,
      batsman: striker,
      is_extra: false,
      normal_runs: runs, // Separate normal runs
      extra_runs: 0 // No extras for normal runs
    };
    
    onRunInput(runs, eventType, runData);
  }, [onRunInput, currentBall, striker]);

  // Handle extra run input - memoized
  const handleExtraRun = useCallback((option) => {
    const extraData = {
      ball_number: currentBall || 1,
      event: option.event,
      runs: option.runs,
      is_wicket: false,
      batsman: striker,
      is_extra: true,
      extra_type: option.type,
      extra_runs: option.runs,
      normal_runs: 0, // No normal runs for extras
      total_runs: option.runs // Total including extras
    };
    
    onRunInput(option.runs, option.event, extraData);
    setShowExtraModal(false);
  }, [onRunInput, currentBall, striker]);

  // Refresh innings data - memoized
  const handleRefresh = useCallback(() => {
    fetchInningsData();
  }, [fetchInningsData]);

  // Handle fielder selection for wicket - memoized
  const handleFielderSelection = useCallback((wicketType) => {
    setSelectedWicketType(wicketType);
    setShowWicketModal(false);
  }, []);

  // Confirm wicket with fielder - memoized
  const confirmWicketWithFielder = useCallback((fielderId) => {
    if (selectedWicketType && fielderId) {
      handleWicket(selectedWicketType, fielderId);
    }
  }, [selectedWicketType, handleWicket]);

  // Get current batsmen stats - memoized
  const getBatsmanStats = useCallback((batsmanName) => {
    if (!inningsData || !inningsData.batting_records) return null;
    return inningsData.batting_records.find(record => 
      record.player_name === batsmanName
    );
  }, [inningsData]);

  // Get current bowler stats - memoized
  const getBowlerStats = useCallback((bowlerName) => {
    if (!inningsData?.bowling_records) return null;
    const bowlerRecord = inningsData.bowling_records.find(record => 
      record.player_name === bowlerName
    );
    if (!bowlerRecord) {
      // Return default stats for new bowler
      return {
        overs_bowled: 0,
        wickets: 0,
        runs_conceded: 0,
        economy_rate: 0,
        maidens: 0,
        extras: 0
      };
    }

    // Calculate economy rate if not provided
    const stats = { ...bowlerRecord };
    if (stats.overs_bowled > 0 && !stats.economy_rate) {
      stats.economy_rate = (stats.runs_conceded / stats.overs_bowled).toFixed(2);
    }

    return stats;
  }, [inningsData]);

  // Auto refresh every 5 seconds and on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchInningsData();
      }
    };
    
    fetchData(); // Initial fetch
    
    // Set up auto refresh interval
    const intervalId = setInterval(fetchData, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchInningsData, currentOver, currentBall]);

  // Fetch data when ball is saved
  useEffect(() => {
    if (isSaved) {
      fetchInningsData();
    }
  }, [isSaved, fetchInningsData]);

  // Auto prompt for bowler change at over end
  useEffect(() => {
    if (currentBall === 6 && isSaved) {
      // Small delay to show prompt after ball is saved
      const timeoutId = setTimeout(() => {
        setShowPlayerModal(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [currentBall, isSaved]);
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center">
          <Target className="w-5 h-5 mr-2 text-green-600" />
          Current Ball ({currentOver || 0}.{currentBall || 0})
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Player Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Current Players</span>
          <button
            onClick={() => setShowPlayerModal(true)}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
          >
            <Users className="w-3 h-3" />
            <span>Change</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-yellow-100 p-2 rounded">
            <div className="font-semibold">🏏 Striker</div>
            <div className="truncate">{striker || 'Not set'}</div>
            {striker && getBatsmanStats(striker) && (
              <div className="text-gray-600">
                {getBatsmanStats(striker).runs || 0}({getBatsmanStats(striker).balls_faced || 0})
              </div>
            )}
          </div>
          
          <div className="bg-blue-100 p-2 rounded">
            <div className="font-semibold">👥 Non-Striker</div>
            <div className="truncate">{nonStriker || 'Not set'}</div>
            {nonStriker && getBatsmanStats(nonStriker) && (
              <div className="text-gray-600">
                {getBatsmanStats(nonStriker).runs || 0}({getBatsmanStats(nonStriker).balls_faced || 0})
              </div>
            )}
          </div>
        </div>
        
        {bowler && (
          <div className="mt-2 bg-red-100 p-2 rounded text-xs">
            <div className="flex items-center justify-between">
              <div className="font-semibold">🎯 Bowler</div>
              {currentBall === 6 && (
                <button
                  onClick={() => setShowPlayerModal(true)}
                  className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs hover:bg-red-300"
                >
                  Change Bowler
                </button>
              )}
            </div>
            <div className="truncate">{bowler}</div>
            {getBowlerStats(bowler) && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="text-gray-600">
                  <span className="font-medium">{getBowlerStats(bowler).overs_bowled || 0}</span> ov, 
                  <span className="font-medium ml-1">{getBowlerStats(bowler).wickets || 0}</span> w
                </div>
                <div className="text-gray-600 text-right">
                  <span className="font-medium">{getBowlerStats(bowler).runs_conceded || 0}</span> runs,
                  <span className="font-medium ml-1">{getBowlerStats(bowler).economy_rate?.toFixed(1) || '0.0'}</span> eco
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Runs Input */}
      <div className="mb-4">
        <h4 className="font-semibold mb-3 text-gray-700">Runs</h4>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(run => (
            <button
              key={run}
              onClick={() => handleRunInput(run)}
              className={`p-3 rounded-lg font-bold transition-all duration-200 ${
                unsavedRuns === run.toString()
                  ? 'bg-blue-500 text-white scale-105 shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {run}
            </button>
          ))}
          <button
            onClick={() => setShowExtraModal(true)}
            className="p-3 rounded-lg font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
          >
            Extra
          </button>
        </div>
      </div>

      {/* Wicket & Events Input */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-gray-700">Events</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowWicketModal(true)}
            className="p-3 rounded-lg font-bold bg-red-100 hover:bg-red-200 text-red-800 transition-colors flex items-center justify-center space-x-1"
          >
            <Zap className="w-4 h-4" />
            <span>Wicket</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="p-3 rounded-lg font-bold bg-green-100 hover:bg-green-200 text-green-800 transition-colors flex items-center justify-center space-x-1"
          >
            <Users className="w-4 h-4" />
            <span>Field Event</span>
          </button>
        </div>
        
        {/* Unsaved Events Display */}
        {(unsavedRuns !== '' || unsavedEvent !== '') && !isSaved && (
          <div className="mt-3 text-sm text-orange-600 font-semibold bg-orange-50 p-2 rounded-lg">
            {unsavedRuns !== '' && `Unsaved: ${unsavedRuns} runs`}
            {unsavedRuns !== '' && unsavedEvent !== '' && ' • '}
            {unsavedEvent !== '' && `Event: ${unsavedEvent}`}
            {!unsavedRuns && !unsavedEvent && 'Click Save to confirm'}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onSaveBall}
          disabled={(unsavedRuns === '' && unsavedEvent === '') || isSaved}
          className={`w-full py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isSaved 
              ? 'bg-green-500 text-white' 
              : unsavedRuns !== '' || unsavedEvent !== ''
                ? 'bg-orange-500 text-white hover:bg-orange-600 scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Ball</span>
            </>
          )}
        </button>

        <button
          onClick={onNextBall}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <ChevronRight className="w-5 h-5" />
          <span>Next Ball</span>
        </button>
      </div>

      {/* Extra Runs Modal */}
      <Modal 
        isOpen={showExtraModal} 
        onClose={() => setShowExtraModal(false)} 
        title="Extra Runs"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select type of extra runs:</p>
          <div className="grid grid-cols-2 gap-2">
            {penaltyRunOptions.map(option => (
              <button
                key={option.type}
                onClick={() => handleExtraRun(option)}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors text-sm"
              >
                {option.label} (+{option.runs})
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Wicket Modal */}
      <Modal 
        isOpen={showWicketModal} 
        onClose={() => setShowWicketModal(false)} 
        title="Wicket"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select wicket type:</p>
          <div className="grid grid-cols-2 gap-2">
            {wicketTypes.map(wicket => (
              <button
                key={wicket.type}
                onClick={() => {
                  if (wicket.requiresFielder) {
                    handleFielderSelection(wicket.type);
                  } else {
                    handleWicket(wicket.type);
                  }
                }}
                className="p-3 bg-red-100 hover:bg-red-200 rounded-lg font-bold transition-colors text-sm"
              >
                {wicket.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Fielder Selection Modal */}
      <Modal 
        isOpen={selectedWicketType !== null} 
        onClose={() => setSelectedWicketType(null)} 
        title="Select Fielder"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select fielder for {selectedWicketType}:</p>
          <div className="max-h-60 overflow-y-auto">
            {availableFielders.map(fielder => (
              <button
                key={fielder.id}
                onClick={() => confirmWicketWithFielder(fielder.id)}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left transition-colors mb-2"
              >
                {fielder.name}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Field Event Modal */}
      <Modal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)} 
        title="Field Event"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select field event:</p>
          <div className="grid grid-cols-2 gap-2">
            {fieldEvents.map(event => (
              <button
                key={event.type}
                onClick={() => handleFieldEvent(event.type)}
                className="p-3 bg-green-100 hover:bg-green-200 rounded-lg font-bold transition-colors text-sm"
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Player Selection Modal */}
      <Modal 
        isOpen={showPlayerModal} 
        onClose={() => setShowPlayerModal(false)} 
        title="Change Players"
        size="md"
      >
        <div className="space-y-4">
          {/* Striker Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              🏏 Striker
            </label>
            <select 
              value={striker} 
              onChange={(e) => handlePlayerChange('striker', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-yellow-50 focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Select Striker</option>
              {availableBatsmen.map(player => (
                <option key={player.id} value={player.name}>
                  {player.name} - {player.runs || 0}({player.balls_faced || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Non-Striker Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              👥 Non-Striker
            </label>
            <select 
              value={nonStriker} 
              onChange={(e) => handlePlayerChange('nonStriker', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-blue-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Non-Striker</option>
              {availableBatsmen.map(player => (
                <option key={player.id} value={player.name}>
                  {player.name} - {player.runs || 0}({player.balls_faced || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Bowler Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              🎯 Bowler
            </label>
            <select 
              value={bowler} 
              onChange={(e) => handlePlayerChange('bowler', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-red-50 focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Bowler</option>
              {availableBowlers.map(player => (
                <option key={player.id} value={player.name}>
                  {player.name} - {player.overs_bowled || 0} ov, {player.wickets || 0}w, {player.runs_conceded || 0} runs, {player.economy_rate?.toFixed(1) || '0.0'} eco
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapBatsmen}
            disabled={!striker || !nonStriker}
            className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              !striker || !nonStriker
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Swap Striker & Non-Striker</span>
          </button>
        </div>
      </Modal>
    </div>
  );
});

export default BallInputPanel;