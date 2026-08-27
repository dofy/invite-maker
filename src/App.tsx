import { useCallback, useState } from 'react';
import { EditorCanvas } from './components/EditorCanvas';
import { AppHeader, ControlPanel } from './components/ControlPanel';
import { ExpandedDataPreview } from './components/DataPreview';

export default function App() {
  const [dataPreviewOpened, setDataPreviewOpened] = useState(false);
  const closeDataPreview = useCallback(() => setDataPreviewOpened(false), []);

  return (
    <div className={`app-shell${dataPreviewOpened ? ' data-preview-opened' : ''}`}>
      <AppHeader />
      <EditorCanvas />
      <ControlPanel
        dataPreviewOpened={dataPreviewOpened}
        onDataPreviewOpenedChange={setDataPreviewOpened}
      />
      {dataPreviewOpened ? <ExpandedDataPreview onClose={closeDataPreview} /> : null}
    </div>
  );
}
