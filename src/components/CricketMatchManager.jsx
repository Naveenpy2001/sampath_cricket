// src/components/CricketMatchManager.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SetupPage from '../pages/SetupPage';
import PlayingPage from '../pages/PlayingPage';
import FinishedPage from '../pages/FinishedPage';
import PlayerManagementContent from './PlayerManagementContent';
import TossDecisionContent from './TossDecisionContent';
import MatchResultContent from './MatchResultContent';
import Toast from './Toast';
import Modal from './Modal';

// API Base URL - adjust according to your Django server
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const CricketMatchManager = () => {
  const MATCH_STATE_KEY = 'cricket_match_state';

  // State
  const [gameState, setGameState] = useState('setup');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [modals, setModals] = useState({
    playerManagement: false,
    tossDecision: false,
    matchResult: false,
    resumePrompt: false
  });
  const [availableTeams, setAvailableTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [liveScore, setLiveScore] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [matchList, setMatchList] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  const [matchConfig, setMatchConfig] = useState({
    id: null,
    matchType: 'T20',
    customMatchType: '',
    overs: 20,
    team1: '',
    team2: '',
    venue: 'Fischer County Ground',
    tossWinner: '',
    tossDecision: '',
    currentInnings: 1
  });
  
  const [teams, setTeams] = useState({
    team1: {
      id: null,
      name: '',
      short_name: '',
      players: []
    },
    team2: {
      id: null,
      name: '',
      short_name: '',
      players: []
    }
  });
  
  const matchIdRef = useRef(null);
  const navigate = useNavigate();

  // Inline API functions with explicit try/catch and endpoint comments
  // Each function below calls the backend directly via axios and includes
  // a short comment with the API endpoint for developer clarity.

  // GET /teams/
  const getTeams = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/teams/`);
      return resp;
    } catch (error) {
      console.error('❌ getTeams Error:', error);
      throw error;
    }
  };

  // POST /teams/
  const createTeam = async (teamData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/teams/`, teamData);
      return resp;
    } catch (error) {
      console.error('❌ createTeam Error:', error);
      throw error;
    }
  };

  // GET /players/ (optionally supports query params)
  const getPlayers = async (params = {}) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/players/`, { params });
      return resp;
    } catch (error) {
      console.error('❌ getPlayers Error:', error);
      throw error;
    }
  };

  // POST /players/
  const createPlayer = async (playerData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/players/`, playerData);
      return resp;
    } catch (error) {
      console.error('❌ createPlayer Error:', error);
      throw error;
    }
  };

  // GET /matches/
  const getMatches = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/matches/`);
      return resp;
    } catch (error) {
      console.error('❌ getMatches Error:', error);
      throw error;
    }
  };

  // POST /matches/
  const createMatch = async (matchData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/matches/`, matchData);
      return resp;
    } catch (error) {
      console.error('❌ createMatch Error:', error);
      throw error;
    }
  };

  // POST /matches/:id/set_toss/
  const setToss = async (matchId, tossData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/matches/${matchId}/set_toss/`, tossData);
      return resp;
    } catch (error) {
      console.error('❌ setToss Error:', error);
      throw error;
    }
  };

  // POST /matches/:id/update_players/
  const updatePlayers = async (matchId, playersData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/matches/${matchId}/update_players/`, playersData);
      return resp;
    } catch (error) {
      console.error('❌ updatePlayers Error:', error);
      throw error;
    }
  };

  // POST /matches/:id/add_ball/
  const addBall = async (matchId, ballData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/matches/${matchId}/add_ball/`, ballData);
      return resp;
    } catch (error) {
      console.error('❌ addBall Error:', error);
      throw error;
    }
  };

  // GET /matches/:id/scorecard/
  const getScorecard = async (matchId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/matches/${matchId}/scorecard/`);
      return resp;
    } catch (error) {
      console.error('❌ getScorecard Error:', error);
      throw error;
    }
  };

  // GET /matches/:id/live_score/
  const getLiveScore = async (matchId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/matches/${matchId}/live_score/`);
      return resp;
    } catch (error) {
      console.error('❌ getLiveScore Error:', error);
      throw error;
    }
  };

  // GET /matches/:id/statistics/
  const getMatchStatistics = async (matchId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/matches/${matchId}/statistics/`);
      return resp;
    } catch (error) {
      console.error('❌ getMatchStatistics Error:', error);
      throw error;
    }
  };

  // POST /matches/:id/complete_match/
  const completeMatch = async (matchId, resultData) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/matches/${matchId}/complete_match/`, resultData);
      return resp;
    } catch (error) {
      console.error('❌ completeMatch Error:', error);
      throw error;
    }
  };

  // GET /matches/:id/resume/
  const getMatchResume = async (matchId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/matches/${matchId}/resume/`);
      return resp;
    } catch (error) {
      console.error('❌ getMatchResume Error:', error);
      throw error;
    }
  };

  // Helper that returns a normalized match list (array)
  const getMatchList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/`);
      if (Array.isArray(response.data)) return response.data;
      if (response.data?.results) return response.data.results;
      return [response.data];
    } catch (error) {
      console.error('❌ getMatchList Error:', error);
      throw error;
    }
  };

  // GET /players/:id/career_stats/
  const getPlayerStats = async (playerId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/players/${playerId}/career_stats/`);
      return resp;
    } catch (error) {
      console.error('❌ getPlayerStats Error:', error);
      throw error;
    }
  };

  // GET /teams/:id/statistics/
  const getTeamStatistics = async (teamId) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/teams/${teamId}/statistics/`);
      return resp;
    } catch (error) {
      console.error('❌ getTeamStatistics Error:', error);
      throw error;
    }
  };

  // API Data Fetching Functions
  const fetchAllData = async () => {
    try {
      // Fetch all data in parallel
      const [teamsResp, playersResp, matchesResp] = await Promise.all([
        getTeams(),
        getPlayers(),
        getMatchList()
      ]);
      
      // Process teams data
      let teamsData = Array.isArray(teamsResp.data) ? teamsResp.data :
                      teamsResp.data?.results ? teamsResp.data.results :
                      teamsResp.data ? [teamsResp.data] : [];
      setAvailableTeams(teamsData);

      // Process players data
      let playersData = Array.isArray(playersResp.data) ? playersResp.data :
                        playersResp.data?.results ? playersResp.data.results :
                        playersResp.data ? [playersResp.data] : [];
      setAllPlayers(playersData);

      // Process matches data and update state
      let matches = Array.isArray(matchesResp) ? matchesResp :
                    matchesResp?.results ? matchesResp.results :
                    matchesResp ? [matchesResp] : [];
      setMatchList(matches);

      // Restore persisted match if available
      const persistedMatchId = localStorage.getItem('matchId');
      if (persistedMatchId) {
        const matchId = parseInt(persistedMatchId);
        matchIdRef.current = matchId;
        await fetchMatchDetails(matchId);
        
        // Find match in list and set as selected
        const match = matches.find(m => m.id === matchId);
        if (match) setSelectedMatch(match);
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      showToast('Error fetching data from server', 'error');
    }
  };

  const fetchMatchDetails = async (matchId) => {
    try {
      // Fetch all match data in parallel
      const [liveResponse, scorecardResponse, resumeResponse] = await Promise.all([
        getLiveScore(matchId),
        getScorecard(matchId),
        getMatchResume(matchId)
      ]);

      // Update all states with fetched data
      setLiveScore(liveResponse.data);
      setScorecard(scorecardResponse.data);
      
      const matchData = resumeResponse.data.match_info;
      setMatchData(matchData);
      
      // Update match configuration if needed
      if (matchData && matchData.status !== 'completed') {
        const newConfig = {
          id: matchId,
          matchType: matchData.match_type || 'T20',
          overs: matchData.overs_per_innings || 20,
          team1: matchData.team1?.id,
          team2: matchData.team2?.id,
          venue: matchData.venue,
          status: matchData.status,
          currentInnings: liveResponse.data?.current_inning?.inning_number || 1,
          tossWinner: matchData.toss_winner?.id,
          tossDecision: matchData.toss_decision
        };
        setMatchConfig(newConfig);
      }

      // Handle super over if exists
      if (resumeResponse.data.super_over) {
        // You can add additional handling for super over data here
        console.log('Super over data available:', resumeResponse.data.super_over);
      }

    } catch (error) {
      console.error('❌ Error fetching match details:', error);
      showToast('Error fetching match details: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  const fetchTeamStatistics = async (teamId) => {
    try {
      const response = await getTeamStatistics(teamId);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team ${teamId} stats:`, error);
      throw error;
    }
  };

  const fetchPlayerCareerStats = async (playerId) => {
    try {
      const response = await getPlayerStats(playerId);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching player ${playerId} stats:`, error);
      throw error;
    }
  };

  // Enhanced team creation with immediate data refresh
  const handleCreateTeam = async (teamData) => {
    try {
      const response = await createTeam(teamData);
      
      showToast(`Team "${teamData.name}" created successfully!`, 'success');
      await fetchAllData(); // Refresh all data
      return response.data;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error creating team: ${errorMsg}`, 'error');
      throw error;
    }
  };

  // Enhanced player creation
  const handleCreatePlayer = async (playerData) => {
    try {
      const response = await createPlayer(playerData);
      
      showToast(`Player "${playerData.fname} ${playerData.lname}" created!`, 'success');
      await fetchAllData(); // Refresh all data
      return response.data;
    } catch (error) {
      console.error('❌ Error creating player:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error creating player: ${errorMsg}`, 'error');
      throw error;
    }
  };

  // Enhanced match creation
 const startMatch = async () => {
  // Validation
  if (!matchConfig.team1 || !matchConfig.team2) {
    showToast('Please select both teams', 'error');
    return;
  }
  if (matchConfig.team1 === matchConfig.team2) {
    showToast('Please select different teams', 'error');
    return;
  }

  try {
    const matchPayload = {
      match_type:
        matchConfig.matchType === 'custom'
          ? matchConfig.customMatchType
          : matchConfig.matchType,
      overs_per_innings: matchConfig.overs,
      team1: parseInt(matchConfig.team1),
      team2: parseInt(matchConfig.team2),
      venue: matchConfig.venue,
      status: 'scheduled',
    };

  
    const createResponse = await createMatch(matchPayload);

    // ✅ FIX: Extract match ID correctly (directly from data)
    const matchId = createResponse.data?.id;

    if (!matchId) {
      console.error('❌ Match ID missing in API response:', createResponse.data);
      showToast('Error: Match ID not found in response', 'error');
      return;
    }

    // ✅ Save match ID in ref + state
    matchIdRef.current = matchId;

    // ✅ Persist to localStorage
    localStorage.setItem('matchId', String(matchId));
    localStorage.setItem(
      'matchConfig',
      JSON.stringify({ ...matchConfig, id: matchId, status: 'scheduled' })
    );

    setMatchConfig((prev) => ({
      ...prev,
      id: matchId,
      status: 'scheduled',
    }));


    // Fetch initial match details
    await fetchMatchDetails(matchId);

    // Navigate to playing page so the UI loads the match immediately
    // The PlayingPage reads matchId from matchIdRef / localStorage
    navigate('/playing');

    // Proceed to toss
    setGameState('toss');
    openModal('tossDecision');
    showToast('Match created successfully!', 'success');
  } catch (error) {
    console.error('❌ Error in startMatch:', error);
    const errorMsg = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    showToast(`Error creating match: ${errorMsg}`, 'error');
  }
};

  // Enhanced toss handling
  const handleTossDecision = async (winner, decision) => {
    const matchId = matchIdRef.current;
    
  

    if (!matchId) {
      showToast('Match ID not found. Please create the match again.', 'error');
      return;
    }

    try {
      const winnerTeam = winner === 'team1' ? teams.team1 : teams.team2;
      const tossData = {
        toss_winner: winnerTeam.id,
        toss_decision: decision
      };
      
      const response = await setToss(matchId, tossData);

      // Update local state
      setMatchConfig(prev => ({ 
        ...prev, 
        tossWinner: winner,
        tossDecision: decision,
        status: 'inning1'
      }));

      // Refresh match details
      await fetchMatchDetails(matchId);
      
      closeModal('tossDecision');
      setGameState('playing');
      // Persist status change for resume
      try {
        const persisted = JSON.parse(localStorage.getItem('matchConfig') || '{}');
        localStorage.setItem('matchConfig', JSON.stringify({
          ...persisted,
          status: 'inning1',
          tossWinner: winner,
          tossDecision: decision
        }));
      } catch {}
      showToast(`${winnerTeam.name} won the toss and chose to ${decision}`, 'success');
      
    } catch (error) {
      console.error('❌ Error setting toss:', error);
      let errorMessage = 'Error setting toss decision';
      if (error.response?.data?.detail) errorMessage = error.response.data.detail;
      else if (error.response?.data) errorMessage = JSON.stringify(error.response.data);
      showToast(errorMessage, 'error');
    }
  };

  // Ball-by-ball updates
  const handleAddBall = async (ballData) => {
    const matchId = matchIdRef.current;
    if (!matchId) {
      showToast('Match ID not found', 'error');
      return;
    }

    try {
      // Normalize payload to ensure required shape
      const inferredInningNumberRaw = (ballData && ballData.inning_number) || matchData?.current_inning_number || matchConfig.currentInnings || 1;
      let inferredInningNumber = parseInt(inferredInningNumberRaw || 1, 10);
      if (!Number.isFinite(inferredInningNumber) || inferredInningNumber < 1) inferredInningNumber = 1;

      const inferredOverNumberRaw = (ballData && ballData.over_number) ?? liveScore?.current_over ?? scorecard?.current_over ?? 1;
      let inferredOverNumber = parseInt(inferredOverNumberRaw || 1, 10);
      if (!Number.isFinite(inferredOverNumber) || inferredOverNumber < 1) inferredOverNumber = 1;

      // If consumer passed a flat ball object (no `ball` wrapper), wrap it
      let normalizedBall = ballData?.ball ? { ...ballData.ball } : { ...(ballData || {}) };

      // Default ball_number if missing
      if (normalizedBall.ball_number == null) {
        const bnRaw = liveScore?.current_ball ?? 1;
        const bn = parseInt(bnRaw || 1, 10);
        normalizedBall.ball_number = Number.isFinite(bn) && bn > 0 ? bn : 1;
      }

      // Minimal defaults to satisfy backend shape
      if (normalizedBall.runs == null) normalizedBall.runs = 0;
      if (normalizedBall.event == null) normalizedBall.event = 'dot';
      // Coerce numeric fields
      normalizedBall.runs = parseInt(normalizedBall.runs || 0, 10);

      // Remove fields that belong to the envelope from the ball object
      delete normalizedBall.inning_number;
      delete normalizedBall.over_number;

      // Prune undefined values
      Object.keys(normalizedBall).forEach((k) => {
        if (normalizedBall[k] === undefined) delete normalizedBall[k];
      });

      const payload = {
        inning_number: inferredInningNumber,
        over_number: inferredOverNumber,
        ball: normalizedBall,
      };

      
      const response = await addBall(matchId, payload);
     

      // Refresh live data
      await fetchMatchDetails(matchId);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error adding ball:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error adding ball: ${errorMsg}`, 'error');
      throw error;
    }
  };

  // Update players on field
  const handleUpdatePlayers = async (playersData) => {
    const matchId = matchIdRef.current;
    if (!matchId) {
      showToast('Match ID not found', 'error');
      return;
    }

    try {
      
      const response = await updatePlayers(matchId, playersData);
      
      
      await fetchMatchDetails(matchId);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating players:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error updating players: ${errorMsg}`, 'error');
      throw error;
    }
  };

  // Complete match
  const finishMatch = async (resultData = null) => {
    const matchId = matchIdRef.current;
    
    if (!matchId) {
      showToast('Match ID not found', 'error');
      return;
    }

    try {
      const completeData = resultData || {
        result: 'team1_win',
        winning_team: teams.team1.id,
        win_margin: 'by 5 wickets'
      };
      
      const response = await completeMatch(matchId, completeData);

      setGameState('finished');
      localStorage.removeItem(MATCH_STATE_KEY);
      localStorage.removeItem('matchId');
      localStorage.removeItem('matchConfig');
      openModal('matchResult');
      showToast('Match completed successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Error completing match:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error completing match: ${errorMsg}`, 'error');
    }
  };

  const resetMatch = () => {
    matchIdRef.current = null;
    localStorage.removeItem(MATCH_STATE_KEY);
    localStorage.removeItem('matchId');
    localStorage.removeItem('matchConfig');
    setGameState('setup');
    setMatchConfig({
      id: null,
      matchType: 'T20',
      customMatchType: '',
      overs: 20,
      team1: '',
      team2: '',
      venue: 'Fischer County Ground',
      tossWinner: '',
      tossDecision: '',
      currentInnings: 1
    });
    setMatchData(null);
    setLiveScore(null);
    setScorecard(null);
    showToast('New match started!', 'info');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Update teams when selection changes
  useEffect(() => {
    if (matchConfig.team1) {
      const selectedTeam = availableTeams.find(team => team.id === parseInt(matchConfig.team1));
      if (selectedTeam) {
        setTeams(prev => ({
          ...prev,
          team1: {
            id: selectedTeam.id,
            name: selectedTeam.name,
            short_name: selectedTeam.short_name,
            players: selectedTeam.players || []
          }
        }));
      }
    }
  }, [matchConfig.team1, availableTeams]);

  useEffect(() => {
    if (matchConfig.team2) {
      const selectedTeam = availableTeams.find(team => team.id === parseInt(matchConfig.team2));
      if (selectedTeam) {
        setTeams(prev => ({
          ...prev,
          team2: {
            id: selectedTeam.id,
            name: selectedTeam.name,
            short_name: selectedTeam.short_name,
            players: selectedTeam.players || []
          }
        }));
      }
    }
  }, [matchConfig.team2, availableTeams]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
    // Prompt to resume if there is persisted state
    try {
      const persistedId = localStorage.getItem('matchId');
      const persistedConfig = localStorage.getItem('matchConfig');
      if (persistedId && persistedConfig) {
        const parsed = JSON.parse(persistedConfig);
        if (parsed?.status && parsed.status !== 'completed') {
          openModal('resumePrompt');
        }
      }
    } catch {}
  }, []);

  const handleResumeMatch = async (matchId = null) => {
    try {
      // Use provided matchId or get from storage
      const targetId = matchId || localStorage.getItem('matchId');
      const persistedConfigRaw = localStorage.getItem('matchConfig');
      
      if (!targetId) {
        showToast('No match found to resume', 'error');
        closeModal('resumePrompt');
        return;
      }

      // Fetch complete match details including resume data
      const [matchResponse, resumeResponse] = await Promise.all([
        getLiveScore(targetId),
        getMatchResume(targetId)
      ]);

      const matchData = matchResponse.data;
      const resumeData = resumeResponse.data;

      // Update match ID reference
      matchIdRef.current = parseInt(targetId);

      // Restore or create new config
      const newConfig = {
        id: parseInt(targetId),
        matchType: matchData.match_type || 'T20',
        overs: matchData.overs_per_innings || 20,
        team1: matchData.team1?.id,
        team2: matchData.team2?.id,
        venue: matchData.venue,
        status: matchData.status,
        currentInnings: resumeData.current_inning?.inning_number || 1,
        tossWinner: matchData.toss_winner?.id,
        tossDecision: matchData.toss_decision
      };

      setMatchConfig(newConfig);
      localStorage.setItem('matchId', targetId);
      localStorage.setItem('matchConfig', JSON.stringify(newConfig));

      // Set appropriate game state
      if (matchData.status === 'scheduled' || matchData.status === 'toss') {
        setGameState('toss');
        openModal('tossDecision');
      } else if (matchData.status === 'inning1' || matchData.status === 'inning2') {
        setGameState('playing');
      } else if (matchData.status === 'completed') {
        setGameState('finished');
      }

      // Update UI with fetched data
      setMatchData(matchData);
      setSelectedMatch(matchData);
      
      if (resumeData.current_inning) {
        setLiveScore(resumeData.current_inning);
      }
      if (resumeData.scorecard) {
        setScorecard(resumeData.scorecard);
      }

      showToast(`Match resumed successfully`, 'success');
    } catch (e) {
      console.error('❌ Error resuming match:', e);
      showToast('Error resuming match: ' + (e.message || 'Unknown error'), 'error');
    }
    closeModal('resumePrompt');
  };

  const handleEndPersistedMatch = () => {
    localStorage.removeItem(MATCH_STATE_KEY);
    localStorage.removeItem('matchId');
    localStorage.removeItem('matchConfig');
    closeModal('resumePrompt');
    resetMatch();
  };

  const handleMatchSelect = async (match) => {
    try {
      setSelectedMatch(match);
      matchIdRef.current = match.id;
      localStorage.setItem('matchId', match.id.toString());

      // Fetch complete match details
      const [liveResponse, scorecardResponse, resumeResponse] = await Promise.all([
        getLiveScore(match.id),
        getScorecard(match.id),
        getMatchResume(match.id)
      ]);

      // Update all states with fetched data
      setLiveScore(liveResponse.data);
      setScorecard(scorecardResponse.data);
      setMatchData(resumeResponse.data.match_info);

      // Update match configuration
      const matchData = resumeResponse.data.match_info;
      const newConfig = {
        id: match.id,
        matchType: matchData.match_type || 'T20',
        overs: matchData.overs_per_innings || 20,
        team1: matchData.team1?.id,
        team2: matchData.team2?.id,
        venue: matchData.venue,
        status: matchData.status,
        currentInnings: liveResponse.data?.current_inning?.inning_number || 1,
        tossWinner: matchData.toss_winner?.id,
        tossDecision: matchData.toss_decision
      };
      setMatchConfig(newConfig);
      
      // Persist match configuration
      localStorage.setItem('matchConfig', JSON.stringify(newConfig));

      // Set game state based on match status
      if (match.status === 'completed') {
        setGameState('finished');
      } else if (match.status === 'scheduled') {
        setGameState('toss');
        openModal('tossDecision');
      } else {
        setGameState('playing');
      }

      showToast(`Match details loaded successfully`, 'success');
    } catch (error) {
      console.error('❌ Error selecting match:', error);
      showToast(`Error loading match details: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  return (
    <div>
      <Routes>
          <Route path="/" element={
            <SetupPage
              matchConfig={matchConfig}
              setMatchConfig={setMatchConfig}
              teams={teams}
              setTeams={setTeams}
              availableTeams={availableTeams}
              allPlayers={allPlayers}
              handleCreateTeam={handleCreateTeam}
              handleCreatePlayer={handleCreatePlayer}
              startMatch={startMatch}
              openModal={openModal}
              fetchTeamStatistics={fetchTeamStatistics}
              matchList={matchList}
              handleMatchSelect={handleMatchSelect}
            />
          } />          <Route path="/playing" element={
            <PlayingPage
              matchConfig={matchConfig}
              teams={teams}
              matchData={matchData}
              liveScore={liveScore}
              scorecard={scorecard}
              handleAddBall={handleAddBall}
              handleUpdatePlayers={handleUpdatePlayers}
              finishMatch={finishMatch}
              openModal={openModal}
              fetchMatchDetails={() => fetchMatchDetails(matchIdRef.current)}
              fetchPlayerCareerStats={fetchPlayerCareerStats}
            />
          } />

          <Route path="/finished" element={
            <FinishedPage
              resetMatch={resetMatch}
              matchData={matchData}
              scorecard={scorecard}
            />
          } />
        </Routes>

        {/* Modals */}
        <Modal
          isOpen={modals.playerManagement}
          onClose={() => closeModal('playerManagement')}
          title="Player Management"
          size="xl"
        >
          <PlayerManagementContent
            teams={teams}
            setTeams={setTeams}
            allPlayers={allPlayers}
            showToast={showToast}
            onCreatePlayer={handleCreatePlayer}
            onFetchPlayerStats={fetchPlayerCareerStats}
          />
        </Modal>

        <Modal
          isOpen={modals.tossDecision}
          onClose={() => closeModal('tossDecision')}
          title="Toss Decision"
          size="md"
        >
          <TossDecisionContent
            matchConfig={matchConfig}
            teams={teams}
            onTossDecision={handleTossDecision}
          />
        </Modal>

        <Modal
          isOpen={modals.matchResult}
          onClose={() => closeModal('matchResult')}
          title="Match Result"
          size="lg"
        >
          <MatchResultContent
            matchConfig={matchConfig}
            teams={teams}
            matchData={matchData}
            scorecard={scorecard}
            onNewMatch={resetMatch}
          />
        </Modal>

        {/* Resume or End Prompt */}
        {/* <Modal
          isOpen={modals.resumePrompt}
          onClose={() => closeModal('resumePrompt')}
          title="Resume match?"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">An ongoing match was found. Would you like to resume where you left off or end it and start a new match?</p>
            <div className="flex space-x-3">
              <button
                onClick={handleResumeMatch}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resume
              </button>
              <button
                onClick={handleEndPersistedMatch}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                End
              </button>
            </div>
          </div>
        </Modal> */}

        <Toast {...toast} onClose={hideToast} />
      </div>
  );
};

export default CricketMatchManager;