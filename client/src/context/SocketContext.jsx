import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState(null)
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'))
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['polling', 'websocket']
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    newSocket.on('supabase-sync-status', (status) => {
      setSupabaseSyncStatus(status)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, []) // run once on mount

  // When adminToken changes, reconnect socket with new auth so server
  // middleware picks up the token and sets socket.isAdmin = true
  useEffect(() => {
    if (!socketRef.current) return
    const s = socketRef.current
    s.auth = { token: adminToken || null }
    // Force reconnect so the server re-runs the auth middleware
    s.disconnect().connect()
  }, [adminToken])

  const authenticateAdmin = useCallback((token) => {
    localStorage.setItem('adminToken', token)
    setAdminToken(token)
  }, [])

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAdminToken(null)
  }, [])

  const joinMatchRoom = useCallback((matchId) => {
    const s = socketRef.current
    if (!s) return
    if (s.connected) {
      s.emit('join-match', matchId)
    } else {
      // Wait for connection then join
      s.once('connect', () => s.emit('join-match', matchId))
    }
  }, [])

  const leaveMatchRoom = useCallback((matchId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-match', matchId)
    }
  }, [])

  const value = {
    socket,
    isConnected,
    adminToken,
    supabaseSyncStatus,
    authenticateAdmin,
    logoutAdmin,
    joinMatchRoom,
    leaveMatchRoom
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}