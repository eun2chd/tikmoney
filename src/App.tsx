import { useEffect, useState } from 'react';
import type { AppData, WorkSettings } from './types/settings';
import { applySettings, clearData, initialData, loadData, saveData } from './lib/storage';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

export default function App() {
  const [data, setData] = useState<AppData | null>(loadData);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  if (!data) {
    return <Settings onSave={(s, prefs) => setData(initialData(s, prefs))} />;
  }

  const current = data.periods[data.periods.length - 1].settings;

  if (editing) {
    return (
      <Settings
        initial={current}
        initialPrefs={data.prefs}
        data={data}
        onCancel={() => setEditing(false)}
        onSave={(s: WorkSettings, prefs) => {
          setData({ ...applySettings(data, s), prefs });
          setEditing(false);
        }}
        onImport={(d) => {
          setData(d);
          setEditing(false);
        }}
        onFullReset={() => {
          clearData();
          setData(null);
          setEditing(false);
        }}
        onReset={() => {
          clearData();
          setData(initialData(current, data.prefs));
          setEditing(false);
        }}
      />
    );
  }

  return (
    <Dashboard
      data={data}
      onOpenSettings={() => setEditing(true)}
      onChangePrefs={(prefs) => setData({ ...data, prefs })}
    />
  );
}
