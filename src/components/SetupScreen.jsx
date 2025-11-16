// src/components/SetupScreen.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Users, ChevronDown, Plus, X, RefreshCw, BarChart3 } from 'lucide-react';

const SetupScreen = ({ 
  matchConfig, 
  setMatchConfig, 
  teams, 
  availableTeams = [],
  allPlayers = [],
  onStartMatch, 
  onOpenPlayerManagement,
  onCreateTeam,
  onCreatePlayer,
  onFetchTeamStats,
  onFetchPlayerStats,
  onFetchTeamMatches
}) => {
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showTeamStats, setShowTeamStats] = useState(false);
  const [selectedTeamForStats, setSelectedTeamForStats] = useState(null);
  const [teamStatistics, setTeamStatistics] = useState({});
  const [playerStatistics, setPlayerStatistics] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [teamMatches, setTeamMatches] = useState({});
  const [selectedStatsTab, setSelectedStatsTab] = useState('overview');
  const [newTeam, setNewTeam] = useState({
    name: '',
    short_name: '',
    created_at: new Date().toISOString()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('🏏 SetupScreen Data:', {
    availableTeams,
    allPlayers,
    teams,
    matchConfig
  });

  const handleTeamChange = async (teamField, teamId) => {
    console.log(`🔄 Changing ${teamField} to:`, teamId);
    setMatchConfig(prev => ({ ...prev, [teamField]: teamId }));

    // Fetch team statistics when team is selected
    if (teamId && onFetchTeamStats) {
      try {
        console.log(`📊 Fetching stats for team ${teamId}`);
        const stats = await onFetchTeamStats(parseInt(teamId));
        setTeamStatistics(prev => ({
          ...prev,
          [teamId]: stats
        }));
        console.log(`✅ Team ${teamId} stats loaded:`, stats);
      } catch (error) {
        console.error(`❌ Error fetching team ${teamId} stats:`, error);
      }
    }
  };

  const handleMatchTypeChange = (type) => {
    console.log('🎯 Changing match type to:', type);
    const oversMap = { 
      'T20': 20, 
      'ODI': 50, 
      'Test': 90, 
      'T10': 10,
      'custom': matchConfig.overs || 20
    };
    
    setMatchConfig(prev => ({ 
      ...prev, 
      matchType: type,
      overs: oversMap[type] || 20,
      customMatchType: type === 'custom' ? prev.customMatchType : ''
    }));
  };

  const getSelectedTeam = (teamId) => {
    const team = availableTeams.find(team => team.id === parseInt(teamId));
    console.log(`🔍 Getting team ${teamId}:`, team);
    return team;
  };

  const handleAddTeam = async () => {
    if (!newTeam.name.trim()) {
      alert('Please enter team name');
      return;
    }

    console.log('🔄 Creating new team:', newTeam);
    setIsSubmitting(true);
    try {
      await onCreateTeam(newTeam);
      setShowAddTeamModal(false);
      setNewTeam({ name: '', short_name: '', created_at: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error creating team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIXED: Properly handle team players filtering
  const getTeamPlayers = (teamId) => {
    if (!teamId) return [];
    // Filter players by team ID - using the correct field name from your API
    const teamPlayers = allPlayers.filter(player => {
      console.log(`🔍 Checking player ${player.id}:`, {
        playerTeam: player.team,
        lookingFor: teamId,
        match: player.team === parseInt(teamId)
      });
      return player.team === parseInt(teamId);
    });
    console.log(`👥 Players for team ${teamId}:`, teamPlayers);
    return teamPlayers;
  };

  const handleViewTeamStats = async (team) => {
    console.log('📈 Viewing stats for team:', team);
    setSelectedTeamForStats(team);
    setShowTeamStats(true);
    setIsLoadingStats(true);
    setSelectedStatsTab('overview');

    try {
      // Fetch team statistics
      if (onFetchTeamStats) {
        const teamStats = await onFetchTeamStats(team.id);
        console.log('📊 Team statistics:', teamStats);
        setTeamStatistics(prev => ({ ...prev, [team.id]: teamStats }));
      }

      // Fetch player statistics for this team
      if (onFetchPlayerStats) {
        const teamPlayers = getTeamPlayers(team.id);
        console.log(`👤 Fetching stats for ${teamPlayers.length} players`);
        
        const playerStatsPromises = teamPlayers.map(async (player) => {
          try {
            const stats = await onFetchPlayerStats(player.id);
            console.log(`✅ Player ${player.id} stats:`, stats);
            return { playerId: player.id, stats };
          } catch (error) {
            console.error(`❌ Error fetching stats for player ${player.id}:`, error);
            return { playerId: player.id, stats: null };
          }
        });

        const playerStatsResults = await Promise.all(playerStatsPromises);
        const playerStatsMap = {};
        playerStatsResults.forEach(result => {
          if (result.stats) {
            playerStatsMap[result.playerId] = result.stats;
          }
        });
        
        setPlayerStatistics(prev => ({ ...prev, ...playerStatsMap }));
        console.log('👤 All player statistics loaded:', playerStatsMap);
      }

      // Fetch team matches
      if (onFetchTeamMatches) {
        try {
          console.log(`🏟️ Fetching matches for team ${team.id}`);
          const matches = await onFetchTeamMatches(team.id);
          setTeamMatches(prev => ({ ...prev, [team.id]: Array.isArray(matches) ? matches : [] }));
          console.log(`✅ Team ${team.id} matches loaded:`, matches);
        } catch (error) {
          console.error(`❌ Error fetching matches for team ${team.id}:`, error);
          setTeamMatches(prev => ({ ...prev, [team.id]: [] }));
        }
      }
    } catch (error) {
      console.error('❌ Error loading statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const team1 = getSelectedTeam(matchConfig.team1);
  const team2 = getSelectedTeam(matchConfig.team2);
  
  // FIXED: Get actual player counts for teams
  const team1Players = getTeamPlayers(matchConfig.team1);
  const team2Players = getTeamPlayers(matchConfig.team2);

  const TeamStatsCard = ({ team }) => {
    const stats = teamStatistics[team?.id];
    const teamPlayers = getTeamPlayers(team?.id);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-gray-800">{team?.name}</h4>
          <button
            onClick={() => handleViewTeamStats(team)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Stats</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Players:</div>
          <div className="font-medium">{teamPlayers.length}</div>
          
          {stats && (
            <>
              <div className="text-gray-600">Matches:</div>
              <div className="font-medium">{stats.total_matches || 0}</div>
              
              <div className="text-gray-600">Wins:</div>
              <div className="font-medium text-green-600">{stats.wins || 0}</div>
              
              <div className="text-gray-600">Win %:</div>
              <div className="font-medium">{stats.win_percentage || 0}%</div>
            </>
          )}
        </div>

        {!stats && (
          <div className="text-xs text-gray-500 mt-2">
            No match statistics available
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Cricket Match Manager</h1>
            <p className="text-gray-600 mt-2">Professional Cricket Scoring & Management System</p>
            
            {/* Data Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-semibold text-blue-800">Teams</div>
                <div className="text-blue-600">{availableTeams.length}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-semibold text-green-800">Players</div>
                <div className="text-green-600">{allPlayers.length}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="font-semibold text-purple-800">Active</div>
                <div className="text-purple-600">{matchConfig.id ? 'Match Ready' : 'Setup'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Team Selection with Stats */}
            <div className="grid grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Team 1</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddTeamModal(true)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded flex items-center space-x-1 hover:bg-green-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Team</span>
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={matchConfig.team1}
                    onChange={(e) => handleTeamChange('team1', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select Team 1</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.short_name && `(${team.short_name})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {team1 && <TeamStatsCard team={team1} />}
              </div>

              {/* Team 2 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Team 2</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddTeamModal(true)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded flex items-center space-x-1 hover:bg-green-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Team</span>
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={matchConfig.team2}
                    onChange={(e) => handleTeamChange('team2', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select Team 2</option>
                    {availableTeams
                      .filter(team => team.id !== parseInt(matchConfig.team1))
                      .map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} {team.short_name && `(${team.short_name})`}
                        </option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {team2 && <TeamStatsCard team={team2} />}
              </div>
            </div>

            {/* Match Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
                <div className="relative">
                  <select
                    value={matchConfig.matchType}
                    onChange={(e) => handleMatchTypeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 appearance-none"
                  >
                    <option value="T20">T20 (20 overs)</option>
                    <option value="ODI">ODI (50 overs)</option>
                    <option value="Test">Test Match (90 overs)</option>
                    <option value="T10">T10 (10 overs)</option>
                    <option value="custom">Custom</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                
                {matchConfig.matchType === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Enter custom match type"
                      value={matchConfig.customMatchType}
                      onChange={(e) => setMatchConfig(prev => ({ ...prev, customMatchType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overs per Innings
                  {matchConfig.matchType !== 'custom' && (
                    <span className="text-gray-500 text-xs ml-1">
                      (default for {matchConfig.matchType})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={matchConfig.overs}
                  onChange={(e) => setMatchConfig(prev => ({ ...prev, overs: parseInt(e.target.value) || 20 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  min="1"
                  max={matchConfig.matchType === 'Test' ? 90 : 50}
                  disabled={matchConfig.matchType === 'Test'}
                />
                {matchConfig.matchType === 'Test' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Test matches use 90 overs per day
                  </p>
                )}
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
              <input
                type="text"
                value={matchConfig.venue}
                onChange={(e) => setMatchConfig(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter match venue"
              />
            </div>

            {/* Enhanced Match Summary */}
            {(team1 || team2) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3">Match Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Teams:</span>
                      <span className="font-medium text-blue-900">
                        {team1?.name || 'TBD'} vs {team2?.name || 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Match Type:</span>
                      <span className="font-medium text-blue-900">
                        {matchConfig.matchType === 'custom' ? matchConfig.customMatchType : matchConfig.matchType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Overs:</span>
                      <span className="font-medium text-blue-900">{matchConfig.overs} per innings</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Venue:</span>
                      <span className="font-medium text-blue-900">{matchConfig.venue}</span>
                    </div>
                  </div>
                </div>
                
                {/* Player Count Summary */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Team 1 Players:</span>
                    <span className={`font-medium ${team1Players.length >= 11 ? 'text-green-600' : 'text-red-600'}`}>
                      {team1Players.length}/11
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Team 2 Players:</span>
                    <span className={`font-medium ${team2Players.length >= 11 ? 'text-green-600' : 'text-red-600'}`}>
                      {team2Players.length}/11
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={onOpenPlayerManagement}
                disabled={!team1 || !team2}
                className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  !team1 || !team2 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Manage Players</span>
              </button>
              <button
                onClick={onStartMatch}
                disabled={!team1 || !team2 || team1Players.length < 11 || team2Players.length < 11}
                className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  (!team1 || !team2 || team1Players.length < 11 || team2Players.length < 11)
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Start Match</span>
              </button>
            </div>

            {/* Validation Messages */}
            {(!team1 || !team2) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm">
                  Please select both teams to continue
                </p>
              </div>
            )}

            {team1 && team2 && (team1Players.length < 11 || team2Players.length < 11) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-700 text-sm">
                  Each team needs at least 11 players. Current: 
                  Team 1 - {team1Players.length}/11, 
                  Team 2 - {team2Players.length}/11
                </p>
                <p className="text-orange-600 text-xs mt-1">
                  Use "Manage Players" to add players to teams
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Create New Team</h3>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Name
                </label>
                <input
                  type="text"
                  value={newTeam.short_name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, short_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., IND, AUS, ENG"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 10 characters (optional)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> After creating the team, you'll need to add players in the Player Management section.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                disabled={!newTeam.name.trim() || isSubmitting}
                className={`flex-1 py-2 px-4 bg-green-500 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  !newTeam.name.trim() || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'hover:bg-green-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Statistics Modal */}
      {showTeamStats && selectedTeamForStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedTeamForStats.name} - Statistics
              </h3>
              <button
                onClick={() => setShowTeamStats(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingStats ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setSelectedStatsTab('overview')}
                      className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${selectedStatsTab === 'overview' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setSelectedStatsTab('matches')}
                      className={`ml-4 px-4 py-2 text-sm font-medium -mb-px border-b-2 ${selectedStatsTab === 'matches' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                    >
                      Matches
                    </button>
                  </div>

                  {selectedStatsTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Team Statistics */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Team Performance</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {teamStatistics[selectedTeamForStats.id]?.total_matches || 0}
                            </div>
                            <div className="text-sm text-gray-600">Matches</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {teamStatistics[selectedTeamForStats.id]?.wins || 0}
                            </div>
                            <div className="text-sm text-gray-600">Wins</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {teamStatistics[selectedTeamForStats.id]?.losses || 0}
                            </div>
                            <div className="text-sm text-gray-600">Losses</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {teamStatistics[selectedTeamForStats.id]?.win_percentage || 0}%
                            </div>
                            <div className="text-sm text-gray-600">Win %</div>
                          </div>
                        </div>
                      </div>

                      {/* Player Statistics */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Player Statistics</h4>
                        <div className="space-y-2">
                          {getTeamPlayers(selectedTeamForStats.id).map(player => (
                            <div key={player.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                              <div>
                                <div className="font-medium">
                                  {player.display_name || `${player.fname} ${player.lname}`}
                                </div>
                                <div className="text-sm text-gray-600 capitalize">{player.role}</div>
                              </div>
                              <div className="text-right">
                                {playerStatistics[player.id] ? (
                                  <div className="text-sm space-y-1">
                                    <div className="text-green-600">
                                      Runs: {playerStatistics[player.id]?.batting?.runs || 0}
                                    </div>
                                    <div className="text-blue-600">
                                      Wkts: {playerStatistics[player.id]?.bowling?.wickets || 0}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">No stats available</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStatsTab === 'matches' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Matches</h4>
                      {(() => {
                        const matches = teamMatches[selectedTeamForStats.id] || [];
                        if (!matches.length) {
                          return (
                            <div className="text-sm text-gray-500 border border-gray-200 rounded-lg p-4">
                              No matches found for this team.
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-2">
                            {matches.map((m) => {
                              const dateText = m.date || m.match_date || m.created_at || '';
                              const venueText = m.venue || m.ground || '';
                              const teamA = m.team1_name || m.team1 || m.home_team || '';
                              const teamB = m.team2_name || m.team2 || m.away_team || '';
                              const result = m.result || m.outcome || '';
                              return (
                                <div key={m.id || `${teamA}-${teamB}-${dateText}`} className="p-3 border border-gray-200 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium text-gray-800">
                                      {teamA && teamB ? `${teamA} vs ${teamB}` : (m.title || 'Match')}
                                    </div>
                                    {dateText && (
                                      <div className="text-xs text-gray-500">{new Date(dateText).toLocaleDateString?.() || dateText}</div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {venueText}
                                  </div>
                                  {result && (
                                    <div className="text-sm mt-1">
                                      <span className="text-gray-600">Result: </span>
                                      <span className="font-medium text-green-700">{result}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SetupScreen;