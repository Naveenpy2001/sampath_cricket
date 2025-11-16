import React from 'react';
import { useNavigate } from 'react-router-dom';
import MatchCompleteScreen from '../components/MatchCompleteScreen';

const FinishedPage = ({
  resetMatch,
  matchData,
  scorecard
}) => {
  const navigate = useNavigate();

  const handleResetMatch = () => {
    resetMatch();
    navigate('/');
  };

  return (
    <MatchCompleteScreen 
      onResetMatch={handleResetMatch}
      matchData={matchData}
      scorecard={scorecard}
    />
  );
};

export default FinishedPage;