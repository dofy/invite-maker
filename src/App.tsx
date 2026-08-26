import { EditorCanvas } from './components/EditorCanvas';
import { ControlPanel } from './components/ControlPanel';

export default function App() {
  return (
    <div className="app-shell">
      <EditorCanvas />
      <ControlPanel />
    </div>
  );
}
