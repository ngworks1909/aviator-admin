import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/store/AuthState"
import { host } from "@/lib/host"
import { toast } from "sonner"

import { UserInterface } from "@/components/users/User"

export function useUsers(limit = 10) {
  const [users, setUsers] = useState<UserInterface[]>([])
  const [skip, setSkip] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalUser, setTotalUser] = useState(0)
  const token = useAuthStore.getState().token
  
  // Use a ref to track if we've already fetched initial data
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const fetchUsers = useCallback(async (isInitialFetch = false) => {
    if (!token || loading || (!hasMore && !isInitialFetch)) return

    setLoading(true)
    try {
      const currentSkip = isInitialFetch ? 0 : skip
      
      const response = await fetch(`${host}/api/user/fetchall?skip=${currentSkip}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch users.")

      const data: {users: UserInterface[], totalUsers: number} = await response.json()
      console.log(`Received ${data.users.length} users`)
      setTotalUser(data.totalUsers
      )

      if (data.users.length < limit) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

      if (isInitialFetch) {
        setUsers(data.users)
        setSkip(limit) // After initial fetch, set skip to limit
      } else {
        setUsers(prev => [...prev, ...data.users])
        setSkip(prev => prev + limit) // Increment skip by limit
      }
      
      if (isInitialFetch) {
        setInitialFetchDone(true)
      }
    } catch (error) {
      console.error(error)
      toast.error("Error fetching users.")
    } finally {
      setLoading(false)
    }
  }, [token, loading, hasMore, skip, limit])

  // Initial fetch when component mounts or token changes
  useEffect(() => {
    if (token) {
      // Reset state when token changes
      setUsers([])
      setSkip(0)
      setHasMore(true)
      setInitialFetchDone(false)
      fetchUsers(true) // Pass true to indicate initial fetch
    }
  }, [token])

  // Expose a fetchMore function that doesn't reset the state
  const fetchMore = useCallback(() => {
    if (initialFetchDone) {
      fetchUsers(false)
    }
  }, [fetchUsers, initialFetchDone])

  return {
    users,
    loading,
    hasMore,
    fetchMore,
    totalUser
  }
}