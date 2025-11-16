// src/components/TossDecisionContent.jsx
import React, { useState } from 'react';
import { Target, Shield, Trophy, Zap, Crown, Sparkles } from 'lucide-react';

const TossDecisionContent = ({ matchConfig, teams, onTossDecision }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const team1 = teams.team1;
  const team2 = teams.team2;

  console.log('🎯 TossDecisionContent Data:', {
    teams,
    team1,
    team2,
    matchConfig
  });

  const handleTeamSelect = (teamKey) => {
    console.log(`🎯 Team selected: ${teamKey}`);
    setSelectedTeam(teamKey);
    setSelectedDecision(null);
  };

  const handleDecisionSelect = (decision) => {
    console.log(`🎯 Decision selected: ${decision}`);
    setSelectedDecision(decision);
  };

  const handleConfirmToss = async () => {
    if (selectedTeam && selectedDecision) {
      console.log('🔄 Confirming toss decision:', {
        selectedTeam,
        selectedDecision,
        team1Id: team1.id,
        team2Id: team2.id,
        winnerTeamId: selectedTeam === 'team1' ? team1.id : team2.id
      });

      setIsAnimating(true);
      
      try {
        // Add a small delay for animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call the parent handler with the toss decision
        console.log('📤 Sending toss decision to parent...');
        await onTossDecision(selectedTeam, selectedDecision);
        
        console.log('✅ Toss decision processed successfully');
      } catch (error) {
        console.error('❌ Error in toss decision:', error);
      } finally {
        setIsAnimating(false);
      }
    } else {
      console.log('❌ Cannot confirm toss: missing team or decision selection');
    }
  };

  const TeamCard = ({ teamKey, team, isSelected }) => {
    if (!team || !team.id) {
      console.log(`❌ Invalid team data for ${teamKey}:`, team);
      return null;
    }

    return (
      <div
        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
          isSelected
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-200'
            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
        }`}
        onClick={() => handleTeamSelect(teamKey)}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <Crown className="w-6 h-6 text-yellow-500 fill-yellow-400" />
          </div>
        )}
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {team.short_name || (team.name ? team.name.substring(0, 3).toUpperCase() : 'TBD')}
          </div>
          
          <h3 className="font-bold text-lg text-gray-800 mb-1">
            {team.name || 'Team Not Set'}
          </h3>
          
          {team.short_name && (
            <p className="text-sm text-gray-500 mb-3">{team.short_name}</p>
          )}
          
          <div className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-block">
            {team.players?.length || 0} Players
          </div>
        </div>

        {isSelected && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-pulse" />
        )}
      </div>
    );
  };

  const DecisionButton = ({ decision, icon: Icon, label, description, isSelected }) => (
    <button
      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
        isSelected
          ? decision === 'bat' 
            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-200'
            : 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-200'
          : 'border-gray-200 bg-white hover:shadow-md'
      }`}
      onClick={() => handleDecisionSelect(decision)}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg transition-colors ${
          isSelected
            ? decision === 'bat' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        </div>
        
        {isSelected && (
          <div className={`w-3 h-3 rounded-full ${
            decision === 'bat' ? 'bg-orange-500' : 'bg-emerald-500'
          }`} />
        )}
      </div>
    </button>
  );

  // Validate teams data
  if (!team1 || !team2 || !team1.id || !team2.id) {
    console.error('❌ Invalid teams data in TossDecisionContent:', { team1, team2 });
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Teams Not Ready</h3>
        <p className="text-gray-600">
          Please ensure both teams are properly configured before the toss.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="text-6xl mb-2">🎯</div>
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Toss Decision
          </h3>
          <p className="text-gray-600 mt-2">
            Choose the toss winner and their decision to start the match
          </p>
        </div>
      </div>

      {/* Team Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-gray-700">
          <Shield className="w-4 h-4 text-purple-500" />
          <span className="font-semibold">Select Toss Winner</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <TeamCard teamKey="team1" team={team1} isSelected={selectedTeam === 'team1'} />
          <TeamCard teamKey="team2" team={team2} isSelected={selectedTeam === 'team2'} />
        </div>
      </div>

      {/* Decision Selection - Only show when team is selected */}
      {selectedTeam && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-center space-x-2 text-gray-700">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="font-semibold">Choose Decision</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <DecisionButton
              decision="bat"
              icon={Target}
              label="Bat First"
              description="Set a target for the opposition"
              isSelected={selectedDecision === 'bat'}
            />
            <DecisionButton
              decision="bowl"
              icon={Trophy}
              label="Bowl First"
              description="Chase the target set by opposition"
              isSelected={selectedDecision === 'bowl'}
            />
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedTeam && selectedDecision && (
        <div className="animate-fadeIn">
          <button
            onClick={handleConfirmToss}
            disabled={isAnimating}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 transform ${
              isAnimating
                ? 'bg-gradient-to-r from-purple-400 to-blue-400 scale-95'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] shadow-lg hover:shadow-xl'
            }`}
          >
            {isAnimating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Match...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Start Match</span>
              </div>
            )}
          </button>
          
          {/* Match Preview */}
          <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <span className="font-semibold text-gray-800">
                {selectedTeam === 'team1' ? team1.name : team2.name}
              </span>
              {' '}won the toss and chose to{' '}
              <span className="font-semibold text-gray-800">
                {selectedDecision === 'bat' ? 'bat first' : 'bowl first'}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">
              Match Type: {matchConfig.matchType} • {matchConfig.overs} overs
            </div>
          </div>
        </div>
      )}

      {/* Debug Information (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs text-yellow-800">
            <strong>Debug Info:</strong><br />
            Selected Team: {selectedTeam}<br />
            Selected Decision: {selectedDecision}<br />
            Team 1 ID: {team1.id}<br />
            Team 2 ID: {team2.id}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      {/* Scoped CSS for this component */}
<style jsx>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
`}</style>

    </div>
  );
};

export default TossDecisionContent;