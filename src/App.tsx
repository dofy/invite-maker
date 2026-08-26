import { EditorCanvas } from './components/EditorCanvas';
import { AppHeader, ControlPanel } from './components/ControlPanel';

export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <EditorCanvas />
      <ControlPanel />
    </div>
  );
}
