import { useEffect, useState } from "react"

interface DashboardData {
  user: number
  deposited: number
  payout: number,
  secured: number
}

export const useDashBoard = () => {
    const [loading, setLoading] = useState(true)

    const [data, setData] = useState<DashboardData>({
      user: 0,
      deposited: 0,
      payout: 0,
      secured: 0
    })
    
    useEffect(() => {
      // Simulate API call with a 2 second delay
      const fetchData = async () => {
        try {
          // This simulates an API call that takes 2 seconds

          const response = await fetch('https://sockets-avi.fivlog.space', {
            method: "GET"
          })

          if (!response || !response.ok) {
            throw new Error("Failed to fetch data")
          }

          if (!response.ok) {
            return
          }

          const json: DashboardData = await response.json();
          
          setData(json)
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }, [])

    return {loading, data}
}