import { Ticket } from "@/components/support/Support"
import { host } from "@/lib/host"
import { useEffect, useState } from "react"

export const useTickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const token = sessionStorage.getItem("authToken")
    useEffect(() => {
        fetch(`${host}/api/ticket/tickets`, {
          method: "GET",
          headers: {
            "authorization": token ?? ""
          }
        }).then((response) => {
          if(response.ok){
            response.json().then((data) => {
              const fetchedtickets: Ticket[] = data.tickets || []
              setTickets(fetchedtickets)
            })
          }
          setLoading(false)
        })
      }, [token])
    return {tickets, loading, setTickets}
}