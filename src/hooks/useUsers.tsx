import { useEffect, useState } from "react";
import { User } from "@/components/users/User";
import { host } from "@/lib/host";

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("authToken")
    useEffect(() => {
        fetch(`${host}/api/user/fetchall`, {
          method: "GET",
          headers: {
            "authorization": token ?? ""
          }
        }).then((response) => {
          if(response.ok){
            response.json().then((data) => {
              const fetchedusers: User[] = data.users || []
              setUsers(fetchedusers)
            })
          }
          setLoading(false)
        })
      }, [token])
    return {users, loading, setUsers}
}