import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const CricketFieldingTracker = ({ matchConfig, teams, onFieldChange }) => {
  const [fielders, setFielders] = useState([
    { id: 1, name: 'Keeper', x: 150, y: 110, color: 'bg-red-500', type: 'keeper', playerId: null, playerName: '' },
    { id: 2, name: 'Slip 1', x: 130, y: 120, color: 'bg-blue-600', type: 'fielder', playerId: null, playerName: '' },
    { id: 3, name: 'Slip 2', x: 110, y: 130, color: 'bg-blue-700', type: 'fielder', playerId: null, playerName: '' },
    { id: 4, name: 'Gully', x: 90, y: 140, color: 'bg-blue-800', type: 'fielder', playerId: null, playerName: '' },
    { id: 5, name: 'Point', x: 70, y: 170, color: 'bg-indigo-500', type: 'fielder', playerId: null, playerName: '' },
    { id: 6, name: 'Cover', x: 130, y: 190, color: 'bg-indigo-600', type: 'fielder', playerId: null, playerName: '' },
    { id: 7, name: 'Mid-off', x: 180, y: 150, color: 'bg-indigo-700', type: 'fielder', playerId: null, playerName: '' },
    { id: 8, name: 'Mid-on', x: 180, y: 200, color: 'bg-purple-500', type: 'fielder', playerId: null, playerName: '' },
    { id: 9, name: 'Mid-wicket', x: 220, y: 190, color: 'bg-purple-600', type: 'fielder', playerId: null, playerName: '' },
    { id: 10, name: 'Square Leg', x: 220, y: 120, color: 'bg-purple-700', type: 'fielder', playerId: null, playerName: '' },
    { id: 11, name: 'Fine Leg', x: 230, y: 80, color: 'bg-purple-800', type: 'fielder', playerId: null, playerName: '' }
  ]);

  const [bowler, setBowler] = useState({ x: 150, y: 250, color: 'bg-black', type: 'bowler', playerId: null, playerName: '' });

  // State for ball trajectory
  const [ballTrajectory, setBallTrajectory] = useState(null);
  const [fielderMovement, setFielderMovement] = useState(null);
  const [draggingFielder, setDraggingFielder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedFielder, setSelectedFielder] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [fieldingTeamPlayers, setFieldingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Bowler types and their field settings
  const bowlerTypes = [
    { id: 'fast', name: 'Fast Bowler', fieldPreset: 'aggressive' },
    { id: 'medium', name: 'Medium Pacer', fieldPreset: 'standard' },
    { id: 'spin', name: 'Spinner', fieldPreset: 'defensive' },
    { id: 'legspin', name: 'Leg Spinner', fieldPreset: 'legside' },
    { id: 'offspin', name: 'Off Spinner', fieldPreset: 'offside' }
  ];

  // Batsman types
  const batsmanTypes = [
    { id: 'rhb', name: 'Right Handed Batsman' },
    { id: 'lhb', name: 'Left Handed Batsman' }
  ];

  // Power play options
  const powerPlays = [
    { id: 'pp1', name: 'Power Play 1' },
    { id: 'pp2', name: 'Power Play 2' },
    { id: 'pp3', name: 'Power Play 3' },
    { id: 'none', name: 'No Power Play' }
  ];

  const [selectedBowler, setSelectedBowler] = useState('fast');
  const [selectedBatsman, setSelectedBatsman] = useState('rhb');
  const [selectedPowerPlay, setSelectedPowerPlay] = useState('pp1');
  const [selectedFieldPreset, setSelectedFieldPreset] = useState('aggressive');

  // Fetch players data
  const fetchPlayers = async () => {
    if (!matchConfig?.id || !teams?.team1?.id || !teams?.team2?.id) return;

    try {
      setIsLoading(true);
      
      // Get batting and bowling teams based on current innings
      const battingTeam = getBattingTeam();
      const bowlingTeam = getBowlingTeam();
      
      // Fetch players for both teams
      const [battingTeamResponse, bowlingTeamResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/players/`, { params: { team_id: battingTeam.id } }),
        axios.get(`${API_BASE_URL}/players/`, { params: { team_id: bowlingTeam.id } })
      ]);

      const battingPlayers = battingTeamResponse.data.results || battingTeamResponse.data || [];
      const bowlingPlayers = bowlingTeamResponse.data.results || bowlingTeamResponse.data || [];

      setFieldingTeamPlayers(bowlingPlayers);
      setBowlingTeamPlayers(bowlingPlayers);
      setAvailablePlayers(bowlingPlayers); // Default to bowling team for fielders

    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get batting team based on toss decision
  const getBattingTeam = () => {
    if (!teams?.team1 || !teams?.team2) return { id: null, name: '' };
    if (matchConfig?.currentInnings === 1) {
      return matchConfig.tossDecision === 'bat' ? 
        (matchConfig.tossWinner === 'team1' ? teams.team1 : teams.team2) :
        (matchConfig.tossWinner === 'team1' ? teams.team2 : teams.team1);
    } else {
      return matchConfig?.currentInnings === 2 ?
        (matchConfig.tossDecision === 'bat' ? 
          (matchConfig.tossWinner === 'team1' ? teams.team2 : teams.team1) :
          (matchConfig.tossWinner === 'team1' ? teams.team1 : teams.team2)) : teams.team1;
    }
  };

  // Get bowling team
  const getBowlingTeam = () => {
    if (!teams?.team1 || !teams?.team2) return { id: null, name: '' };
    const battingTeam = getBattingTeam();
    if (!battingTeam?.id) return { id: null, name: '' };
    return battingTeam.id === teams.team1.id ? teams.team2 : teams.team1;
  };

  useEffect(() => {
    fetchPlayers();
  }, [matchConfig?.id, teams?.team1?.id, teams?.team2?.id, matchConfig?.currentInnings]);

  // Emit current field state upward whenever relevant state changes
  useEffect(() => {
    if (!onFieldChange) return;
    const payload = {
      match_id: matchConfig?.id,
      inning_number: matchConfig?.currentInnings,
      batsman_type: selectedBatsman,
      bowler_type: selectedBowler,
      power_play: selectedPowerPlay,
      field_preset: selectedFieldPreset,
      fielders,
      bowler,
      ball_trajectory: ballTrajectory
    };
    onFieldChange(payload);
  }, [fielders, bowler, ballTrajectory, selectedBatsman, selectedBowler, selectedPowerPlay, selectedFieldPreset]);


 

  // Check if a point is within the field boundaries
  const isPointInField = (x, y) => {
    const centerX = 150;
    const centerY = 150;
    const radius = 140;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    return distance <= radius;
  };

  // Handle ball click to set trajectory
  const handleBallClick = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isPointInField(x, y)) {
      setBallTrajectory({ x, y });
    }
  };

  // Handle fielder drag start
  const handleFielderDrag = (e, id) => {
    e.preventDefault();
    setDraggingFielder(id);
    isDraggingRef.current = true;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFielderMovement({ x, y });
  };

  // Handle fielder movement
  const handleFielderMove = (e) => {
    if (!draggingFielder) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isPointInField(x, y)) {
      setFielderMovement({ x, y });
    }
  };

  // Handle fielder drop
  const handleFielderDrop = () => {
    if (!draggingFielder || !fielderMovement) {
      isDraggingRef.current = false;
      setDraggingFielder(null);
      setFielderMovement(null);
      return;
    }
    
    if (isPointInField(fielderMovement.x, fielderMovement.y)) {
      setFielders(fielders.map(fielder => 
        fielder.id === draggingFielder 
          ? { ...fielder, x: fielderMovement.x, y: fielderMovement.y }
          : fielder
      ));
    }
    
    setDraggingFielder(null);
    setFielderMovement(null);
    isDraggingRef.current = false;
  };

  // Window-level mouse listeners to ensure reliable drag end
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      handleFielderMove(e);
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      handleFielderDrop();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingFielder, fielderMovement]);

 
  // Handle player assignment to field position
  const handleAssignPlayer = (fielderId, player) => {
    setFielders(fielders.map(fielder => 
      fielder.id === fielderId 
        ? { 
            ...fielder, 
            playerId: player.id, 
            playerName: player.display_name || `${player.fname} ${player.lname}` 
          }
        : fielder
    ));
    setShowPlayerModal(false);
    setSelectedFielder(null);
  };

  // Handle bowler assignment
  const handleAssignBowler = (player) => {
    setBowler({ 
      ...bowler, 
      playerId: player.id, 
      playerName: player.display_name || `${player.fname} ${player.lname}` 
    });
    setShowPlayerModal(false);
    setSelectedFielder(null);
  };

  // Open player selection modal
  const openPlayerModal = (fielderId, isBowler = false) => {
    setSelectedFielder({ id: fielderId, isBowler });
    setShowPlayerModal(true);
  };

  // Auto-apply field positions when selection changes (no manual button)
  useEffect(() => {
    try {
      const centerX = 150;
      const centerY = 150;
      const ring = (r, angleDeg) => ({
        x: centerX + r * Math.cos((Math.PI / 180) * angleDeg),
        y: centerY + r * Math.sin((Math.PI / 180) * angleDeg)
      });
      let updated = [...fielders];
      const isSpinner = selectedBowler === 'spin' || selectedBowler === 'legspin' || selectedBowler === 'offspin';
      const presetKey = selectedPowerPlay !== 'none' ? `${selectedPowerPlay}_${selectedBatsman}_${isSpinner ? 'spin' : selectedBowler}` : selectedFieldPreset;
      if (presetKey.includes('aggressive') || presetKey.includes('pp1')) {
        const angles = [210, 230, 250, 290, 330, 30, 70, 110, 150, 180];
        updated = updated.map((f, idx) => idx < angles.length ? { ...f, ...ring(80, angles[idx]) } : f);
      } else if (presetKey.includes('defensive') || presetKey.includes('pp3')) {
        const angles = [200, 220, 240, 260, 280, 300, 320, 340, 20, 40];
        updated = updated.map((f, idx) => idx < angles.length ? { ...f, ...ring(120, angles[idx]) } : f);
      }
      setFielders(updated);
    } catch {}
  }, [selectedBatsman, selectedBowler, selectedPowerPlay, selectedFieldPreset]);



  // Get color for fielder based on type and color class
  const getFielderColor = (fielder) => {
    if (fielder.type === 'keeper') return '#ef4444';
    if (fielder.type === 'bowler') return '#000000';
    return fielder.color.includes('blue') ? '#3b82f6' : 
           fielder.color.includes('indigo') ? '#6366f1' : 
           fielder.color.includes('purple') ? '#8b5cf6' : '#22c55e';
  };

  // Get display name for fielder
  const getFielderDisplayName = (fielder) => {
    if (fielder.playerName) {
      return fielder.playerName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return fielder.name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="xl:col-span-3 bg-white rounded-xl shadow-md p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Field Position Configuration
      </h3>
      
      {/* Team Information */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Batting Team:</span> {getBattingTeam()?.name || ''}
          </div>
          <div>
            <span className="font-semibold">Bowling Team:</span> {getBowlingTeam()?.name || ''}
          </div>
          <div>
            <span className="font-semibold">Innings:</span> {matchConfig?.currentInnings || ''}
          </div>
          <div>
            <span className="font-semibold">Available Players:</span> {availablePlayers.length}
          </div>
        </div>
      </div>
      
      {/* Configuration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Batsman Type</label>
          <select 
            value={selectedBatsman}
            onChange={(e) => setSelectedBatsman(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {batsmanTypes.map((batsman) => (
              <option key={batsman.id} value={batsman.id}>{batsman.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bowler Type</label>
          <select 
            value={selectedBowler}
            onChange={(e) => setSelectedBowler(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {bowlerTypes.map((bowler) => (
              <option key={bowler.id} value={bowler.id}>{bowler.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Power Play</label>
          <select 
            value={selectedPowerPlay}
            onChange={(e) => setSelectedPowerPlay(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {powerPlays.map((pp) => (
              <option key={pp.id} value={pp.id}>{pp.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Action Buttons removed: field auto-saves with ball */}
      
      {/* Field Visualization */}
      <div className="relative mb-6">
        <svg 
          ref={svgRef}
          viewBox="0 0 300 300" 
          className="w-full h-80 border-2 border-gray-300 rounded-lg cursor-crosshair bg-green-50"
          onClick={handleBallClick}
          onMouseMove={handleFielderMove}
          onMouseUp={handleFielderDrop}
        >
          {/* Field boundaries */}
          <circle cx="150" cy="150" r="140" fill="#e5f3e5" stroke="#22c55e" strokeWidth="3" />
          <circle cx="150" cy="150" r="80" fill="#d1f2d1" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5" />
          
          {/* Pitch */}
          <rect x="140" y="120" width="20" height="60" fill="#8b5a3c" stroke="#654321" strokeWidth="1" />
          
          {/* Stumps */}
          <circle cx="150" cy="130" r="3" fill="#000" stroke="#fff" strokeWidth="1" />
          <circle cx="150" cy="170" r="3" fill="#000" stroke="#fff" strokeWidth="1" />
          
          {/* Bowler */}
          <g>
            <circle
              cx={bowler.x}
              cy={bowler.y}
              r="10"
              fill="#000000"
              stroke="#fff"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80"
            />
            <text
              x={bowler.x}
              y={bowler.y - 15}
              textAnchor="middle"
              className="text-xs fill-gray-700 pointer-events-none font-semibold"
            >
              {bowler.playerName ? getFielderDisplayName(bowler) : 'BOWL'}
            </text>
          </g>
          
          {/* Leg side and Off side indicators */}
          <text x="80" y="150" textAnchor="middle" className="text-xs fill-gray-600 font-semibold">Leg Side</text>
          <text x="220" y="150" textAnchor="middle" className="text-xs fill-gray-600 font-semibold">Off Side</text>
          
          {/* Fielders */}
          {fielders.map(fielder => (
            <g key={fielder.id}>
              <circle
                cx={fielder.x}
                cy={fielder.y}
                r="10"
                fill={getFielderColor(fielder)}
                stroke="#fff"
                strokeWidth="2"
                className="cursor-move hover:opacity-80 transition-opacity"
                onMouseDown={(e) => handleFielderDrag(e, fielder.id)}
              />
              <text
                x={fielder.x}
                y={fielder.y - 15}
                textAnchor="middle"
                className="text-xs fill-gray-700 pointer-events-none font-semibold"
              >
                {getFielderDisplayName(fielder)}
              </text>
            </g>
          ))}
          
          {/* Ball trajectory */}
          {ballTrajectory && (
            <g>
              <line
                x1="150"
                y1="130"
                x2={ballTrajectory.x}
                y2={ballTrajectory.y}
                stroke="#f59e0b"
                strokeWidth="4"
                strokeDasharray="8,4"
              />
              <circle
                cx={ballTrajectory.x}
                cy={ballTrajectory.y}
                r="6"
                fill="#dc2626"
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}
          
          {/* Fielder movement */}
          {fielderMovement && (
            <circle
              cx={fielderMovement.x}
              cy={fielderMovement.y}
              r="8"
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              strokeDasharray="6,3"
            />
          )}
        </svg>
      </div>
      
      {/* Player Assignment Modal removed per requirements */}
      
      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <p className="flex items-center mb-1">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Click on field to set ball direction
        </p>
        <p className="flex items-center mb-1">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          Drag fielders to reposition them
        </p>
        <p className="flex items-center mb-1">
          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Click on fielders/bowler to assign players
        </p>
        <p className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Select batsman, bowler, power play and field preset to adjust field settings
        </p>
      </div>

      {/* Color Legend */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold mb-2">Color Legend:</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Wicket Keeper</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-black rounded-full mr-2"></div>
            <span>Bowler</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span>Fielders</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CricketFieldingTracker;