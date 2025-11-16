
import { BrowserRouter as Router } from 'react-router-dom';
import CricketMatchManager from './components/CricketMatchManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <CricketMatchManager />
      </div>
    </Router>
  );
}

export default App;