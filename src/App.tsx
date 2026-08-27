import { useState } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { AppHeader, ControlPanel, DataPreviewSidebar } from './components/ControlPanel';

export default function App() {
  const [dataPreviewOpened, setDataPreviewOpened] = useState(false);

  return (
    <div className={`app-shell${dataPreviewOpened ? ' data-preview-opened' : ''}`}>
      <AppHeader />
      <EditorCanvas />
      <ControlPanel
        dataPreviewOpened={dataPreviewOpened}
        onDataPreviewOpenedChange={setDataPreviewOpened}
      />
      <DataPreviewSidebar
        opened={dataPreviewOpened}
        onClose={() => setDataPreviewOpened(false)}
      />
    </div>
  );
}
