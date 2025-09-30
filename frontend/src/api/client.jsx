import axios from 'axios'
// Axios是基於Promise的HTTP Client Library，專門用來在瀏覽器(前端)或Node.js(後端)中發送HTTP請求。

export const api = axios.create({
  baseURL: 'http://localhost:8080',  // 後端API網址
  timeout: 10000,
})

api.interceptors.response.use( // 回應攔截器
  (res) => res.data, // 呼叫端拿到的是Axios的完整response物件(含 data, status, headers…)
  (err) => { // 把錯誤包成一個拒絕的Promise往外拋，讓呼叫端的.catch()接到
    return Promise.reject(err)
  }
)
