// src/components/PlayerManagementContent.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Trophy, UserPlus, Edit, Trash2, Save, X, RefreshCw, BarChart3 } from 'lucide-react';
import axios from 'axios';

// API Base URL - adjust according to your Django server
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const PlayerManagementContent = ({ 
  teams, 
  setTeams, 
  showToast, 
  allPlayers = [],
  onCreatePlayer,
  onFetchPlayerStats 
}) => {
  const [newPlayer, setNewPlayer] = useState({
    fname: '',
    lname: '',
    display_name: '',
    role: 'batsman',
    bowler_type: '',
    batsman_type: '',
    left_handed: false,
    age: 18,
    jersey_number: '',
    team: teams.team1?.id || ''
  });

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playerStatistics, setPlayerStatistics] = useState({});
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  console.log('👤 PlayerManagement Data:', {
    teams,
    allPlayers,
    team1Players: teams.team1?.players,
    team2Players: teams.team2?.players
  });

  // Direct API calls with axios
  const apiGet = async (endpoint) => {
    console.log(`🔄 GET ${endpoint}`);
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      console.log(`✅ GET ${endpoint} Success:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ GET ${endpoint} Error:`, error);
      throw error;
    }
  };

  const apiPost = async (endpoint, data) => {
    console.log(`🔄 POST ${endpoint}:`, data);
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
      console.log(`✅ POST ${endpoint} Success:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ POST ${endpoint} Error:`, error);
      throw error;
    }
  };

  const apiPut = async (endpoint, data) => {
    console.log(`🔄 PUT ${endpoint}:`, data);
    try {
      const response = await axios.put(`${API_BASE_URL}${endpoint}`, data);
      console.log(`✅ PUT ${endpoint} Success:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ PUT ${endpoint} Error:`, error);
      throw error;
    }
  };

  const apiDelete = async (endpoint) => {
    console.log(`🔄 DELETE ${endpoint}`);
    try {
      const response = await axios.delete(`${API_BASE_URL}${endpoint}`);
      console.log(`✅ DELETE ${endpoint} Success`);
      return response;
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} Error:`, error);
      throw error;
    }
  };

  // Get players with optional team filter
  const getPlayers = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/players/?${queryString}` : '/players/';
    return await apiGet(endpoint);
  };

  // Create player
  const createPlayer = async (playerData) => {
    return await apiPost('/players/', playerData);
  };

  // Update player
  const updatePlayer = async (playerId, playerData) => {
    return await apiPut(`/players/${playerId}/`, playerData);
  };

  // Delete player
  const deletePlayer = async (playerId) => {
    return await apiDelete(`/players/${playerId}/`);
  };

  // Fetch players when teams change
  useEffect(() => {
    const fetchPlayersForTeams = async () => {
      console.log('🔄 Fetching players for teams...');
      const updatedTeams = { ...teams };
      
      for (const [teamKey, team] of Object.entries(teams)) {
        if (team.id) {
          try {
            console.log(`📥 Fetching players for team ${team.id} (${team.name})`);
            const response = await getPlayers({ team_id: team.id });
            
            // Handle different response formats
            let players = [];
            if (Array.isArray(response.data)) {
              players = response.data;
            } else if (response.data && response.data.results) {
              players = response.data.results;
            } else if (response.data) {
              players = [response.data];
            }
            
            console.log(`✅ Team ${team.name} players:`, players);
            
            updatedTeams[teamKey].players = players;
          } catch (error) {
            console.error(`❌ Error fetching players for ${team.name}:`, error);
            updatedTeams[teamKey].players = [];
          }
        }
      }
      
      setTeams(updatedTeams);
    };

    if (teams.team1?.id || teams.team2?.id) {
      fetchPlayersForTeams();
    }
  }, [teams.team1?.id, teams.team2?.id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`✏️ Input change - ${name}:`, value);
    setNewPlayer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`✏️ Edit input change - ${name}:`, value);
    setEditingPlayer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addPlayer = async () => {
    if (!newPlayer.fname || !newPlayer.lname) {
      showToast('Please enter first name and last name', 'error');
      return;
    }

    if (!newPlayer.team) {
      showToast('Please select a team', 'error');
      return;
    }

    console.log('🔄 Adding new player:', newPlayer);
    setIsLoading(true);
    try {
      // Prepare player data
      const playerData = {
        team: parseInt(newPlayer.team),
        fname: newPlayer.fname.trim(),
        lname: newPlayer.lname.trim(),
        role: newPlayer.role,
        left_handed: newPlayer.left_handed,
        age: parseInt(newPlayer.age) || 18,
        ...(newPlayer.display_name && { display_name: newPlayer.display_name.trim() }),
        ...(newPlayer.batsman_type && { batsman_type: newPlayer.batsman_type }),
        ...(newPlayer.bowler_type && { bowler_type: newPlayer.bowler_type }),
        ...(newPlayer.jersey_number && { jersey_number: parseInt(newPlayer.jersey_number) })
      };

      console.log('📤 Sending player data:', playerData);
      
      let response;
      if (onCreatePlayer) {
        response = await onCreatePlayer(playerData);
      } else {
        response = await createPlayer(playerData);
      }
      
      console.log('✅ Player created:', response.data);

      // Update local state
      const updatedTeams = { ...teams };
      const teamKey = Object.keys(teams).find(key => teams[key].id === parseInt(newPlayer.team));
      
      if (teamKey) {
        updatedTeams[teamKey].players = [
          ...(updatedTeams[teamKey].players || []),
          response.data
        ];
        setTeams(updatedTeams);
        console.log(`✅ Updated ${teamKey} players list`);
      }

      // Reset form
      setNewPlayer({
        fname: '',
        lname: '',
        display_name: '',
        role: 'batsman',
        bowler_type: '',
        batsman_type: '',
        left_handed: false,
        age: 18,
        jersey_number: '',
        team: teams.team1?.id || ''
      });

      showToast(`${response.data.display_name || response.data.fname} added successfully!`, 'success');
    } catch (error) {
      console.error('❌ Error adding player:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error adding player: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditPlayer = (player) => {
    console.log('✏️ Starting edit for player:', player);
    setEditingPlayer({ ...player });
  };

  const cancelEdit = () => {
    console.log('❌ Canceling edit');
    setEditingPlayer(null);
  };

  const updatePlayerData = async () => {
    if (!editingPlayer.fname || !editingPlayer.lname) {
      showToast('Please enter first name and last name', 'error');
      return;
    }

    console.log('🔄 Updating player:', editingPlayer);
    setIsLoading(true);
    try {
      // Prepare update data
      const updateData = {
        fname: editingPlayer.fname.trim(),
        lname: editingPlayer.lname.trim(),
        role: editingPlayer.role,
        left_handed: editingPlayer.left_handed,
        age: parseInt(editingPlayer.age) || 18,
        ...(editingPlayer.display_name && { display_name: editingPlayer.display_name.trim() }),
        ...(editingPlayer.batsman_type && { batsman_type: editingPlayer.batsman_type }),
        ...(editingPlayer.bowler_type && { bowler_type: editingPlayer.bowler_type }),
        ...(editingPlayer.jersey_number ? { jersey_number: parseInt(editingPlayer.jersey_number) } : { jersey_number: null })
      };

      console.log('📤 Sending update data:', updateData);
      const response = await updatePlayer(editingPlayer.id, updateData);
      console.log('✅ Player updated:', response.data);
      
      // Update local state
      const updatedTeams = { ...teams };
      Object.keys(updatedTeams).forEach(teamKey => {
        if (updatedTeams[teamKey].players) {
          updatedTeams[teamKey].players = updatedTeams[teamKey].players.map(player =>
            player.id === editingPlayer.id ? response.data : player
          );
        }
      });
      
      setTeams(updatedTeams);
      setEditingPlayer(null);
      showToast('Player updated successfully!', 'success');
    } catch (error) {
      console.error('❌ Error updating player:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error updating player: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to delete ${playerName}?`)) {
      return;
    }

    console.log('🗑️ Deleting player:', playerId, playerName);
    setIsLoading(true);
    try {
      await deletePlayer(playerId);
      console.log('✅ Player deleted');
      
      // Update local state
      const updatedTeams = { ...teams };
      Object.keys(updatedTeams).forEach(teamKey => {
        if (updatedTeams[teamKey].players) {
          updatedTeams[teamKey].players = updatedTeams[teamKey].players.filter(
            player => player.id !== playerId
          );
        }
      });
      
      setTeams(updatedTeams);
      showToast('Player deleted successfully!', 'success');
    } catch (error) {
      console.error('❌ Error deleting player:', error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'Please try again.';
      showToast(`Error deleting player: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlayerStats = async (player) => {
    console.log('📈 Viewing stats for player:', player);
    setSelectedPlayerForStats(player);
    setShowPlayerStats(true);
    setIsLoadingStats(true);

    try {
      if (onFetchPlayerStats) {
        const stats = await onFetchPlayerStats(player.id);
        console.log('📊 Player statistics:', stats);
        setPlayerStatistics(prev => ({
          ...prev,
          [player.id]: stats
        }));
      } else {
        // Fallback: try to fetch stats directly
        try {
          const response = await apiGet(`/players/${player.id}/career_stats/`);
          console.log('📊 Player statistics (direct):', response.data);
          setPlayerStatistics(prev => ({
            ...prev,
            [player.id]: response.data
          }));
        } catch (statsError) {
          console.error('❌ Error fetching player stats directly:', statsError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading player statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const PlayerStatsModal = () => {
    const stats = playerStatistics[selectedPlayerForStats?.id];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              {selectedPlayerForStats?.display_name || `${selectedPlayerForStats?.fname} ${selectedPlayerForStats?.lname}`}
            </h3>
            <button
              onClick={() => setShowPlayerStats(false)}
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
            ) : stats ? (
              <div className="space-y-4">
                {/* Batting Stats */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Batting Career</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Innings</div>
                      <div className="font-bold text-lg">{stats.batting?.innings || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Runs</div>
                      <div className="font-bold text-lg text-green-600">{stats.batting?.runs || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Average</div>
                      <div className="font-bold text-lg">{stats.batting?.average || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Strike Rate</div>
                      <div className="font-bold text-lg">{stats.batting?.strike_rate || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">4s/6s</div>
                      <div className="font-bold text-lg">{stats.batting?.fours || 0}/{stats.batting?.sixes || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Bowling Stats */}
                {(stats.bowling?.wickets > 0 || stats.bowling?.overs > 0) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3">Bowling Career</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">Wickets</div>
                        <div className="font-bold text-lg text-red-600">{stats.bowling?.wickets || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Overs</div>
                        <div className="font-bold text-lg">{stats.bowling?.overs || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Economy</div>
                        <div className="font-bold text-lg">{stats.bowling?.economy || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Maidens</div>
                        <div className="font-bold text-lg">{stats.bowling?.maidens || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {(!stats.batting?.innings && !stats.bowling?.wickets) && (
                  <div className="text-center text-gray-500 py-4">
                    No career statistics available
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No statistics available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Add New Player Form */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center text-lg">
            <UserPlus className="w-6 h-6 mr-2 text-green-600" />
            Add New Player
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                name="fname"
                placeholder="First Name *"
                value={newPlayer.fname}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="text"
                name="lname"
                placeholder="Last Name *"
                value={newPlayer.lname}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="text"
                name="display_name"
                placeholder="Display Name (optional)"
                value={newPlayer.display_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="number"
                name="age"
                placeholder="Age (optional)"
                value={newPlayer.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="16"
                max="50"
              />
            </div>
            <div>
              <select
                name="team"
                value={newPlayer.team}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Team *</option>
                {Object.values(teams).map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                name="role"
                value={newPlayer.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="allrounder">All-rounder</option>
                <option value="wicketkeeper">Wicket Keeper</option>
              </select>
            </div>
          </div>
          
          {(newPlayer.role === 'bowler' || newPlayer.role === 'allrounder') && (
            <div className="mt-4">
              <select
                name="bowler_type"
                value={newPlayer.bowler_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Bowling Type (optional)</option>
                <option value="fast">Fast Bowler</option>
                <option value="medium">Medium Pace</option>
                <option value="spin">Spin Bowler</option>
                <option value="leg-spin">Leg Spin</option>
                <option value="off-spin">Off Spin</option>
              </select>
            </div>
          )}

          <div className="mt-4">
            <select
              name="batsman_type"
              value={newPlayer.batsman_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Batsman Type (optional)</option>
              <option value="opener">Opener</option>
              <option value="middle_order">Middle Order</option>
              <option value="finisher">Finisher</option>
              <option value="allrounder">All-rounder</option>
            </select>
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="leftHanded"
              name="left_handed"
              checked={newPlayer.left_handed}
              onChange={handleInputChange}
              className="mr-2 w-4 h-4 text-blue-600"
            />
            <label htmlFor="leftHanded" className="text-sm font-medium">Left-handed batsman</label>
          </div>
          
          <input
            type="number"
            name="jersey_number"
            placeholder="Jersey Number (optional)"
            value={newPlayer.jersey_number}
            onChange={handleInputChange}
            className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button
            onClick={addPlayer}
            disabled={isLoading || !newPlayer.fname || !newPlayer.lname || !newPlayer.team}
            className={`w-full mt-4 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-2 ${
              isLoading || !newPlayer.fname || !newPlayer.lname || !newPlayer.team
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Adding Player...' : 'Add Player'}</span>
          </button>
        </div>

        {/* Teams Display with CRUD and Stats */}
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(teams).map(([teamKey, team]) => (
            <div key={teamKey} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="font-bold text-lg mb-3 text-gray-800 flex items-center justify-between">
                <span className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  {team.name}
                </span>
                <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {team.players?.length || 0} players
                </span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {team.players?.filter(player => player && player.id).map(player => (
                  <div key={player.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    {editingPlayer?.id === player.id ? (
                      // Edit Form
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="fname"
                            value={editingPlayer.fname}
                            onChange={handleEditInputChange}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="First Name"
                          />
                          <input
                            type="text"
                            name="lname"
                            value={editingPlayer.lname}
                            onChange={handleEditInputChange}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Last Name"
                          />
                        </div>
                        <input
                          type="text"
                          name="display_name"
                          value={editingPlayer.display_name || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Display Name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            name="role"
                            value={editingPlayer.role}
                            onChange={handleEditInputChange}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="batsman">Batsman</option>
                            <option value="bowler">Bowler</option>
                            <option value="allrounder">All-rounder</option>
                            <option value="wicketkeeper">Wicket Keeper</option>
                          </select>
                          <input
                            type="number"
                            name="age"
                            value={editingPlayer.age}
                            onChange={handleEditInputChange}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Age"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={updatePlayerData}
                            disabled={isLoading}
                            className="flex-1 bg-green-500 text-white py-1 px-2 rounded text-sm flex items-center justify-center space-x-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-gray-500 text-white py-1 px-2 rounded text-sm flex items-center justify-center space-x-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-800 flex items-center">
                            <span>{player.display_name || `${player.fname} ${player.lname}`}</span>
                            {player.left_handed && (
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">LH</span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleViewPlayerStats(player)}
                              className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                              title="View Stats"
                            >
                              <BarChart3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => startEditPlayer(player)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Edit Player"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removePlayer(player.id, player.display_name || `${player.fname} ${player.lname}`)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Delete Player"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          <div className="flex justify-between">
                            <span className="capitalize">{player.role}</span>
                            <span>Age {player.age}</span>
                          </div>
                          {player.bowler_type && (
                            <div className="text-green-600 mt-1 capitalize">{player.bowler_type} bowler</div>
                          )}
                          {player.batsman_type && (
                            <div className="text-purple-600 mt-1 capitalize">{player.batsman_type.replace('_', ' ')}</div>
                          )}
                          {player.jersey_number && (
                            <div className="text-blue-600 mt-1">#{player.jersey_number}</div>
                          )}

                          {/* Quick Stats Preview */}
                          {playerStatistics[player.id] && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs bg-gray-50 p-2 rounded">
                              <div>Runs: <span className="font-semibold">{playerStatistics[player.id]?.batting?.runs || 0}</span></div>
                              <div>Wkts: <span className="font-semibold">{playerStatistics[player.id]?.bowling?.wickets || 0}</span></div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {(!team.players || team.players.length === 0) && (
                  <div className="text-center text-gray-500 py-4">
                    No players added yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Statistics Modal */}
      {showPlayerStats && <PlayerStatsModal />}
    </>
  );
};

export default PlayerManagementContent;