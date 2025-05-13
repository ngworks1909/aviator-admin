"use client"

import { useState, useRef, useCallback } from "react"
import Navbar from "../common/Navbar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Phone, Search, Gamepad2, Trophy, TrendingUp, TrendingDown, Wallet, X, Eye, AlertCircle } from 'lucide-react'
import { Badge } from "../ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUsers } from "@/hooks/useUsers"
import { toast } from "sonner"
import { host } from "@/lib/host"
import { useAuthStore } from "@/store/AuthState"

export type UserInterface = {
  userId: string
  username: string
  mobile: string
  suspended: boolean
  wallet: {
    balance: number,
    bonus: number
  }
  bets: {
    amount: number
    cashoutValue: number | null
    room: {
      maxRate: number,
      createdAt: Date
    }
  }[]
}

function formatIndianNumber(num: number): string {
  return num.toLocaleString("en-IN")
}

function formatDateTime(dateString: Date) {
  // Pad single digit numbers with leading zero
  const date = new Date(dateString);
  const pad = (n: number) => (n < 10 ? '0' + n : n);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const year = date.getFullYear();

  const val = date.getHours();

  const hours = pad(val % 12 === 0 ? 12 : val % 12);
  const minutes = pad(date.getMinutes());

  const formattedDate = `${day}/${month}/${year}`;
  const formattedTime = `${hours}:${minutes}`;

  return { date: formattedDate, time: formattedTime, m: date.getHours() >= 12 ? "PM" : "AM" };
}



function UserCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
        <Skeleton className="h-10 w-[48%]" />
        <Skeleton className="h-10 w-[48%]" />
      </CardFooter>
    </Card>
  )
}

interface BetsModalProps {
  isOpen: boolean
  onClose: () => void
  bets: UserInterface["bets"]
  username: string
}

function BetsModal({ isOpen, onClose, bets, username }: BetsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{username}'s Bets</DialogTitle>
          <DialogDescription>View all bet history and outcomes</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {bets.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">No bets found</h3>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {bets.map((bet, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Bet #{index + 1}</span>
                    <Badge variant="outline">{bet.cashoutValue !== null ? "Completed" : "Failed"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Amount:</div>
                    <div className="font-medium">₹{formatIndianNumber(bet.amount)}</div>

                    <div className="text-gray-500 dark:text-gray-400">Cashout:</div>
                    <div
                      className={
                        bet.cashoutValue !== null
                          ? "font-medium text-green-600 dark:text-green-400"
                          : "font-medium text-red-600 dark:text-red-400"
                      }
                    >
                      {bet.cashoutValue !== null ? `${formatIndianNumber(bet.cashoutValue)}X` : "Failed"}
                    </div>

                    {bet.cashoutValue !== null && (
                      <>
                        <div className="text-gray-500 dark:text-gray-400">Total Return:</div>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          ₹{formatIndianNumber(bet.amount * bet.cashoutValue)}
                        </div>
                      </>
                    )}
                    <>
                        <div className="text-gray-500 dark:text-gray-400">Max Rate:</div>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {bet.room.maxRate}
                        </div>
                      </>

                      <>
                      <div className="text-gray-500 dark:text-gray-400">Created At:</div>
                      <div className="font-medium">{formatDateTime(bet.room.createdAt).date}</div>
                      </>

                      <>
                      <div className="text-gray-500 dark:text-gray-400">Time:</div>
                      <div className="font-medium">{formatDateTime(bet.room.createdAt).time} {formatDateTime(bet.room.createdAt).m}</div>
                      </>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface UserCardProps {
  user: UserInterface
  userRole: string
  onSuspend: (userId: string) => void
}

function UserCard({ user, userRole, onSuspend }: UserCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getAmountWon = () => {
    let amount = 0,
      won = 0
    user.bets.forEach((bet) => {
      if (bet.cashoutValue !== null) {
        amount += bet.cashoutValue * bet.amount
        won++
      }
    })
    return { amount, won }
  }

  const getAmountLost = () => {
    let amount = 0,
      lost = 0
    user.bets.forEach((bet) => {
      if (bet.cashoutValue === null) {
        amount += bet.amount
        lost++
      }
    })
    return { amount, lost }
  }

  const wonDetails = getAmountWon()
  const lostDetails = getAmountLost()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-gray-300 dark:border-gray-700">
              <AvatarImage src={`https://i.pravatar.cc/150?img=${user.userId}`} alt={user.username} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.username}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Phone size={16} />
                <span>{`+91 ${user.mobile}`}</span>
              </p>
            </div>
          </div>
          <Badge variant={user.suspended ? "destructive" : "secondary"} className="h-6 flex items-center gap-1">
            {user.suspended ? <AlertCircle size={14} /> : <User size={14} />}
            {user.suspended ? "Suspended" : "Active"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <UserStat icon={Gamepad2} label="Total Matches" value={user.bets.length} color="blue" />
          <UserStat icon={Trophy} label="Matches Won" value={wonDetails.won} color="green" />
          <UserStat icon={X} label="Matches Lost" value={lostDetails.lost} color="red" />
          <UserStat icon={TrendingUp} label="Amount Won" value={wonDetails.amount} prefix="₹" color="emerald" />
          <UserStat icon={TrendingDown} label="Amount Lost" value={lostDetails.amount} prefix="₹" color="rose" />
          <UserStat icon={Wallet} label="Wallet Balance" value={user.wallet.balance} prefix="₹" color="purple" />
          <UserStat icon={TrendingDown} label="Bonus" value={user.wallet.bonus} prefix="₹" color="green" />
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
        <Button
          variant="outline"
          className={userRole === "superadmin" || userRole === "admin" ? "w-[48%]" : "w-full"}
          onClick={() => setIsModalOpen(true)}
        >
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
        {(userRole === "superadmin" || userRole === "admin") && (
          <Button
            variant="destructive"
            className="w-[48%] flex items-center justify-center"
            onClick={() => onSuspend(user.userId)}
            disabled={user.suspended}
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            {user.suspended ? "Suspended" : "Suspend User"}
          </Button>
        )}
      </CardFooter>

      <BetsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} bets={user.bets} username={user.username} />
    </Card>
  )
}

interface UserStatProps {
  icon: React.ElementType
  label: string
  value: number
  prefix?: string
  color: string
}

function UserStat({ icon: Icon, label, value, prefix, color }: UserStatProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    green: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    red: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    emerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
    rose: "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg p-3 transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <Icon size={24} className="mb-2" />
      <span className="text-sm font-medium mb-1">{label}</span>
      <span className="font-semibold text-lg">
        {prefix && <span className="mr-1">{prefix}</span>}
        {formatIndianNumber(value)}
      </span>
    </div>
  )
}

export default function Users() {
  const { users, loading, fetchMore, totalUser } = useUsers()
  const [searchTerm, setSearchTerm] = useState("")
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { token, userRole } = useAuthStore()

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile.includes(searchTerm),
  )

  const handleSuspendUser = (userId: string) => {
    setSuspendUserId(userId)
    setIsSuspendDialogOpen(true)
  }

  const confirmSuspendUser = async () => {
    try {
      if (suspendUserId && token) {
        const res = await fetch(`${host}/api/user/suspend/${suspendUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", authorization: token },
        })
        if (res.ok) {
          toast("User has been suspended.")
        } else {
          toast("Failed to suspend the user.")
        }
      }
    } catch (error) {
      toast("Failed to suspend the user.")
    } finally {
      setIsSuspendDialogOpen(false)
      setSuspendUserId(null)
    }
  }

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()
      
      observerRef.current = new IntersectionObserver((entries) => {
        // Only fetch more if the element is intersecting, we're not already loading, and there's more to fetch
        if (entries[0]?.isIntersecting) {
          console.log("Fetching more users, current skip:", users.length)
          fetchMore()
        }
      })
      
      if (node) observerRef.current.observe(node)
    },
    [loading, fetchMore, users.length] // Include users.length to recreate the observer when we have new users
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
            <div className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Total Users: {loading ? <Skeleton className="w-20 h-6 inline-block" /> : totalUser}
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && users.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <UserCardSkeleton key={i} />)
            : filteredUsers.map((user) => (
                <UserCard key={user.userId} user={user} userRole={userRole || "employee"} onSuspend={handleSuspendUser} />
              ))}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="text-center mt-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-semibold text-gray-700 dark:text-gray-300">No users found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        )}

        <div ref={lastElementRef} className="h-10 mt-10" />
      </main>

      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>Are you sure you want to suspend this user?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsSuspendDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspendUser}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}