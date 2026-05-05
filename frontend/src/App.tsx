import { useBreakStore } from './stores/breakStore'
import NavBar from './components/layout/NavBar'
import WheelControls from './components/wheel/WheelControls'
import AdminPanel from './components/admin/AdminPanel'
import HistoryView from './components/history/HistoryView'

export default function App() {
  const view = useBreakStore((s) => s.view)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'wheel' && <WheelControls />}
        {view === 'admin' && <AdminPanel />}
        {view === 'history' && <HistoryView />}
      </main>
    </div>
  )
}
