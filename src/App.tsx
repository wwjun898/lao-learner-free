import { useEffect } from 'react';
import { useNavigation } from './hooks/useNavigation';
import HomePage from './pages/HomePage';
import VocabularyPage from './pages/VocabularyPage';
import DialoguePage from './pages/DialoguePage';
import FlashcardPage from './pages/FlashcardPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import StatsPage from './pages/StatsPage';
import NumberCalculatorPage from './pages/NumberCalculatorPage';
import ScenarioPage from './pages/ScenarioPage';
import AnalysisLibraryPage from './pages/AnalysisLibraryPage';
import WordFormationPage from './pages/WordFormationPage';

function App() {
  const { page, navigate, goBack } = useNavigation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  switch (page) {
    case 'vocabulary':
      return <VocabularyPage goBack={goBack} />;
    case 'dialogue':
      return <DialoguePage goBack={goBack} />;
    case 'flashcard':
      return <FlashcardPage goBack={goBack} />;
    case 'search':
      return <SearchPage goBack={goBack} />;
    case 'analysis-library':
      return <AnalysisLibraryPage goBack={goBack} />;
    case 'favorites':
      return <FavoritesPage goBack={goBack} />;
    case 'stats':
      return <StatsPage goBack={goBack} />;
    case 'calculator':
      return <NumberCalculatorPage goBack={goBack} />;
    case 'scenario':
      return <ScenarioPage goBack={goBack} />;
    case 'word-formation':
      return <WordFormationPage goBack={goBack} />;
    default:
      return <HomePage navigate={navigate} />;
  }
}

export default App;
