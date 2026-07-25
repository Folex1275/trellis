import { useEffect } from 'react';
import Navbar from './components/Navbar';
import { NetworkBackground } from './components/NetworkBackground';
import { useRoute, initializeRouter } from './lib/router';
import HomePage from './pages/HomePage';
import StatusPage from './pages/StatusPage';
import CreatePage from './pages/CreatePage';

function App() {
  const route = useRoute();

  useEffect(() => {
    initializeRouter();
  }, []);

  const renderPage = () => {
    switch (route.page) {
      case 'status':
        return <StatusPage />;
      case 'create':
        return <CreatePage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="relative min-h-screen text-gray-200">
      {/* Animated particle network background */}
      <NetworkBackground />

      {/* All content sits above the canvas */}
      <div className="relative z-10">
        <Navbar />
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
