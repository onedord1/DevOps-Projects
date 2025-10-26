'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './auth-context'
import type { WebSocketEvent } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'

interface WebSocketContextType {
  isConnected: boolean
  lastEvent: WebSocketEvent | null
  subscribe: (callback: (event: WebSocketEvent) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const subscribersRef = useRef<Set<(event: WebSocketEvent) => void>>(new Set())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) return

    const connect = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws?token=${token}`)

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const wsEvent: WebSocketEvent = {
              type: data.event?.type || 'unknown',
              data: data.event,
              timestamp: data.published_at,
            }
            
            setLastEvent(wsEvent)
            
            // Notify all subscribers
            subscribersRef.current.forEach((callback) => {
              callback(wsEvent)
            })
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          wsRef.current = null
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated) {
              connect()
            }
          }, 5000)
        }

        wsRef.current = ws
      } catch (error) {
        console.error('Error connecting to WebSocket:', error)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isAuthenticated, user])

  const subscribe = (callback: (event: WebSocketEvent) => void) => {
    subscribersRef.current.add(callback)
    
    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback)
    }
  }

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
