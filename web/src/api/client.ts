import axios from 'axios'

export interface NetworkTiming {
  total: number
  dns: number
  tcp: number
  request: number
  response: number
}

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add timing information to requests
apiClient.interceptors.request.use((config) => {
  const timing: NetworkTiming = {
    total: 0,
    dns: 0,
    tcp: 0,
    request: 0,
    response: 0,
  }
  
  // @ts-ignore - we're adding our own property
  config.timing = timing
  // @ts-ignore - we're adding our own property
  config.startTime = performance.now()
  
  return config
})

// Add timing information to responses
apiClient.interceptors.response.use((response) => {
  // @ts-ignore - accessing our own property
  const startTime = response.config.startTime
  const endTime = performance.now()
  const total = endTime - startTime
  
  const timing: NetworkTiming = {
    total,
    dns: 0, // These would need browser APIs to measure
    tcp: 0,
    request: total * 0.3, // Rough estimate
    response: total * 0.7, // Rough estimate
  }
  
  // @ts-ignore - accessing metadata from config
  if (response.config.metadata?.onTiming) {
    // @ts-ignore - accessing metadata from config
    response.config.metadata.onTiming(timing)
  }
  
  return response
})

export default apiClient 