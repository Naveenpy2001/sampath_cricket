import React from 'react';
import { useNavigate } from 'react-router-dom';
import SetupScreen from '../components/SetupScreen';

const SetupPage = ({
  matchConfig,
  setMatchConfig,
  teams,
  setTeams,
  availableTeams,
  allPlayers,
  handleCreateTeam,
  handleCreatePlayer,
  startMatch,
  openModal,
  fetchTeamStatistics,
  matchList,
  handleMatchSelect
}) => {
  const navigate = useNavigate();

  const handleStartMatch = async () => {
    const result = await startMatch();
    if (result) {
      navigate('/playing');
    }
  };

  const handleMatchClick = async (match) => {
    await handleMatchSelect(match);
    
    // Navigate based on match status
    if (match.status === 'completed') {
      navigate('/finished');
    } else {
      // For all other states (inning1, inning2, scheduled, toss)
      navigate('/playing');
    }
  };

  return (
    <>
      <SetupScreen
        matchConfig={matchConfig}
        setMatchConfig={setMatchConfig}
        teams={teams}
        setTeams={setTeams}
        availableTeams={availableTeams}
        allPlayers={allPlayers}
        onCreateTeam={handleCreateTeam}
        onCreatePlayer={handleCreatePlayer}
        onStartMatch={handleStartMatch}
        onOpenPlayerManagement={() => openModal('playerManagement')}
        onFetchTeamStats={fetchTeamStatistics}
      />

      {/* Match List Section */}
      <div className="mt-12 mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Recent Matches</h2>
            <p className="text-blue-100">Browse and resume your previous cricket matches</p>
          </div>
          
          <div className="bg-white rounded-b-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matchList.map((match) => (
                  <div
                    key={match.id}
                    className="group relative bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:scale-102 cursor-pointer overflow-hidden"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-lg text-gray-800">
                          {match.team1_name} <span className="text-gray-400">vs</span> {match.team2_name}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' :
                          match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-2">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {match.venue}
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
                    </div>
                  </div>
                ))}
              </div>

              {matchList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M12 20V4" />
                  </svg>
                  <p className="text-lg font-medium">No matches found</p>
                  <p className="text-sm">Start a new match to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupPage;