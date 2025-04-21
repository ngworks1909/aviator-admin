'use client'

import { useState } from 'react'
import Navbar from "../common/Navbar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, IndianRupee } from 'lucide-react'
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { usePayments } from '@/hooks/usePayments'
import { Navigate } from 'react-router-dom'
import { host } from '@/lib/host'
import { useAuthStore } from '@/store/AuthState'
import { Payment } from '@/hooks/usePayments'

export default function Payments() {
  const state = useAuthStore()
  
  const [paymentStates, setPaymentStates] = useState<{ [key: string]: { isApproving: boolean, paymentStatus: Payment['paymentStatus'] } }>({})
  const {payments, setPayments, loading} = usePayments();
  const token = state.token
  const role = state.userRole
  if (!role) {
    return <Navigate to="/login" replace />
  }

  const handleApprove = async(id: string) => {
    if(!token) return
    setPaymentStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isApproving: true }
    }))

    const response = await fetch(`${host}/api/withdrawls/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': token
      },
      body: JSON.stringify({ status: 'Success' })
    });

    if(response.ok){
        setPaymentStates(prev => ({
            ...prev,
            [id]: { isApproving: false, paymentStatus: 'Success' }
        }));

        setPayments(prev => prev.map(payment => 
          payment.withdrawlId === id ? { ...payment, paymentStatus: 'Success' } : payment
        ))
    }
    else{
        setPaymentStates(prev => ({
            ...prev,
            [id]: { isApproving: false, paymentStatus: 'Failed' }
        }))
    }
  }

  const getpaymentStatusColor = (paymentStatus: Payment['paymentStatus']) => {
    switch (paymentStatus) {
      case 'Pending': return 'bg-yellow-500'
      case 'Success': return 'bg-green-500'
      case 'Failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Payment Requests</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array(6).fill(0).map((_, index) => <SkeletonCard key={index} />)
          ) : (
            payments.map((payment) => (
              <motion.div
                key={payment.withdrawlId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden transition-shadow gap-0 duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${payment.user.username}`} />
                        <AvatarFallback>{payment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-semibold">{payment.user.username}</h2>
                        <p className="text-sm text-gray-500">
                          {payment.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Amount:</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {payment.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">paymentStatus:</span>
                        <Badge className={`${getpaymentStatusColor(paymentStates[payment.withdrawlId]?.paymentStatus || payment.paymentStatus)} transition-colors duration-300`}>
                          {paymentStates[payment.withdrawlId]?.paymentStatus || payment.paymentStatus}
                        </Badge>
                      </div>
                     {
                        payment.accountNumber && (
                            <>
                               <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Account:</span>
                        <span className="font-semibold flex items-center">
                          {payment.accountNumber}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">IFSC:</span>
                        <span className="font-semibold flex items-center">
                          {payment.ifsc}
                        </span>
                      </div>
                            </>
                        )
                     }

                     {payment.upi && (
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">UPI:</span>
                        <span className="font-semibold flex items-center">
                          {payment.upi}
                        </span>
                      </div>
                     )}

                   {payment.cryptoId && (
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Crypto:</span>
                        <span className="font-semibold flex items-center">
                          {payment.upi}
                        </span>
                      </div>
                     )}
                      
                    </div>
                  </CardContent>
                  {(role === 'admin' || role === 'superadmin') && (paymentStates[payment.withdrawlId]?.paymentStatus || payment.paymentStatus) === 'Pending' && (
                    <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4">
                      <Button 
                        className="w-full transition-all duration-300 hover:bg-green-600"
                        onClick={() => handleApprove(payment.withdrawlId)}
                        disabled={paymentStates[payment.withdrawlId]?.isApproving}
                      >
                        {paymentStates[payment.withdrawlId]?.isApproving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}