import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlayingScreen from '../components/PlayingScreen';

const PlayingPage = ({
  matchConfig,
  teams,
  matchData,
  liveScore,
  scorecard,
  handleAddBall,
  handleUpdatePlayers,
  finishMatch,
  openModal,
  fetchMatchDetails,
  fetchPlayerCareerStats
}) => {
  const navigate = useNavigate();

  const handleFinishMatch = async (resultData) => {
    await finishMatch(resultData);
    navigate('/finished');
  };

  return (
    <PlayingScreen
      matchConfig={matchConfig}
      teams={teams}
      matchData={matchData}
      liveScore={liveScore}
      scorecard={scorecard}
      onAddBall={handleAddBall}
      onUpdatePlayers={handleUpdatePlayers}
      onFinishMatch={handleFinishMatch}
      onOpenPlayerManagement={() => openModal('playerManagement')}
      onFetchMatchDetails={fetchMatchDetails}
      onFetchPlayerStats={fetchPlayerCareerStats}
    />
  );
};

export default PlayingPage;