'use client'

import { useState, useEffect } from "react"
import { Edit, UserPlus, Trash2, Search } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigate, useNavigate } from "react-router-dom"
import Navbar from "../common/Navbar"
import { Skeleton } from "../ui/skeleton"
import { host } from "@/lib/host"
import { useAuthStore } from "@/store/AuthState"
import { toast } from "sonner"
import { useAdmins } from "@/hooks/useAdmins"

export type Admin = {
  adminId: string
  adminName: string
  email: string
  role: 'admin' | 'superadmin'
}

export default function Admin() {
  const { admins, loading, setAdmins } = useAdmins()
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [updatedName, setUpdatedName] = useState("")
  const [updatedEmail, setUpdatedEmail] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdateButtonDisabled, setIsUpdateButtonDisabled] = useState(true)
  const navigate = useNavigate();
  const {setToken, ...state} = useAuthStore()
  const setAuth = (auth: string | null) => {
    setToken(auth)
  }
  const token = state.token
  const currentUserRole = state.userRole
  if (!currentUserRole) {
    return <Navigate to="/login" replace />
  }

  const handleUpdateClick = (admin: Admin) => {
    setSelectedAdmin(admin)
    setUpdatedName(admin.adminName)
    setUpdatedEmail(admin.email)
    setIsUpdateModalOpen(true)
    setIsUpdateButtonDisabled(true)
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (selectedAdmin) {
      setIsUpdateButtonDisabled(
        updatedName === selectedAdmin.adminName && updatedEmail === selectedAdmin.email
      )
    }
  }, [updatedName, updatedEmail, selectedAdmin])

  const handleUpdate = async () => {
    if (selectedAdmin) {
      try {
        const response = await fetch(`${host}/api/admin/edit/${selectedAdmin.adminId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            "authorization": token ?? ""
          },
          body: JSON.stringify({ name: updatedName, email: updatedEmail }),
        })

        if (response.ok) {
          const json = await response.json();
          const updatedAdmin = json.admin;
          setAdmins(admins.map(admin => 
            admin.adminId === selectedAdmin.adminId ? updatedAdmin : admin
          ))
          setIsUpdateModalOpen(false)
          toast('Admin details have been updated.')
        } else {
          toast('Failed to update admin details. Please try again.')
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast('Failed to update admin details. Please try again.')
      }
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`${host}/api/admin/delete/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          "authorization": token ?? ""
        }
      })

      if (response.ok) {
        setAdmins(admins.filter(admin => admin.adminId !== adminId))
        toast('The admin has been successfully removed.')
      } else {
        throw new Error('Failed to delete admin')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast('Failed to delete admin. Please try again.')
    }
  }

  const handleTransferClick = () => {
    setIsTransferModalOpen(true)
  }

  const logOut = () => {
    sessionStorage.removeItem('authToken')
    toast('You have successfully transferred your role.')
    setAuth(null)
    navigate("/login")
  }

  const handleTransfer = async (newSuperadminId: string) => {
    try {
      const response = await fetch(`${host}/api/admin/transfer/${newSuperadminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "authorization": token ?? ""
        }
      })

      if (response.ok) {
        setIsTransferModalOpen(false)
        logOut()
      } else {
        toast('Failed to transfer superadmin role. Please try again.')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast('Failed to transfer superadmin role. Please try again.')
    }
  }

  const filteredAdmins = admins.filter(admin => 
    admin.role === 'admin' && admin.adminName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[60px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-[150px]" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-9 w-[80px]" />
        <Skeleton className="h-9 w-[80px]" />
      </CardFooter>
    </Card>
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Management</h1>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <Card className="p-6 text-center">
            <CardTitle className="text-xl mb-2">No Admins Found</CardTitle>
            <p className="text-muted-foreground">There are currently no admins in the system.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admins.map((admin) => (
              <Card key={admin.adminId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{admin.adminName}</CardTitle>
                  <Badge variant={admin.role === 'superadmin' ? "default" : "secondary"}>
                    {admin.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </CardContent>
                {currentUserRole === 'superadmin' && (
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateClick(admin)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Update
                    </Button>
                    {admin.role === 'superadmin' ? (
                      <Button 
                        variant="default"
                        size="sm" 
                        onClick={handleTransferClick}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Transfer Role
                      </Button>
                    ) : (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteAdmin(admin.adminId)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Admin Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdate} disabled={isUpdateButtonDisabled}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transfer Superadmin Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            {filteredAdmins.length === 0 ? (
              <Card className="p-6 text-center">
                <CardTitle className="text-xl mb-2">No Admins Found</CardTitle>
                <p className="text-muted-foreground">There are no admins available to transfer the role to.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAdmins.map((admin) => (
                  <Card key={admin.adminId}>
                    <CardHeader>
                      <CardTitle>{admin.adminName}</CardTitle>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        onClick={() => handleTransfer(admin.adminId)}
                        className="w-full">
                        Transfer Role
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}