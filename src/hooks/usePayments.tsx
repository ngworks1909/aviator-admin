import { useEffect, useState } from "react";

import { redirect } from "react-router-dom";
import { host } from "@/lib/host";

export interface Payment {
    amount: number;
    accountNumber: string | null;
    ifsc: string | null;
    upi: string | null;
    cryptoId: string | null;
    withdrawlId: string;
    paymentStatus: 'Pending' | 'Success' | 'Failed';
    createdAt: Date;
    user: {
        userId: string,
        username: string
    };
}

export const usePayments = () => {
    const token = sessionStorage.getItem('authToken')
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if(!token){
            redirect('/login');
            return
        }
        fetch(`${host}/api/withdrawls/fetchall`, {
          method: "GET",
          headers: {
            "authorization": token
          },
        }).then((response) => {
          if(response.ok){
            response.json().then((data) => {
              const fetchedpayments = data.withdrawals || [];
              setPayments(fetchedpayments)
            })
          }
          setLoading(false)
        })
      }, [token]);

      return {payments, loading, setPayments}
}