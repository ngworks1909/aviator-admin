import { Admin } from "@/components/admin/Admin";
import { host } from "@/lib/host";
import { useEffect, useState } from "react";
export const useAdmins = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('authToken')
  useEffect(() => {
        fetch(`${host}/api/admin/admins`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
             "authorization": token ?? ""
          }
        }).then((response) => {
          if(response.ok){
            response.json().then((data) => {
              const fetchedadmins: Admin[] = data.admins ?? []
              setAdmins(fetchedadmins)
            })
          }
          setLoading(false)
        })
      }, [token])
  return {admins, loading, setAdmins}
}