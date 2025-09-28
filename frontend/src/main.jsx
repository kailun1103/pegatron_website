import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>                    {/* StrictMode：開發模式下幫助檢查潛在錯誤，不會影響生產環境 */}
    <QueryClientProvider client={qc}>   {/* 提供React Query的Client，讓整個App內部可以使用useQuery/useMutation */}
      <BrowserRouter>                   {/* 提供路由功能，讓 App 內的 <Route> 可以運作 */}
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)