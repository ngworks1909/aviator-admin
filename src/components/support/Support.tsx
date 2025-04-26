'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Navbar from "../common/Navbar"
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from "@/components/ui/skeleton"
import { InboxIcon, Loader2 } from 'lucide-react'
import { host } from '@/lib/host'
import { toast } from 'sonner'

export interface Ticket {
  ticketId: string;
  issue: string;
  email: string;
  name: string;
  description: string;
  status: "Open" | "Closed";
  createdAt: Date;
  image: string | null;
}

const TicketSkeleton = () => (
  <div className="bg-white shadow rounded-lg p-4">
    <div className="flex justify-between items-start mb-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-16" />
    </div>
    <Skeleton className="h-4 w-full" />
  </div>
)

const NoTicketsMessage = () => (
  <div className="text-center py-12">
    <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets to solve</h3>
    <p className="mt-1 text-sm text-gray-500">Great job! You've solved all the tickets.</p>
  </div>
)

export default function Support() {
  const {tickets, setTickets, loading} = useTickets()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [textarea, setTextArea] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [markAsComplete, setMarkAsComplete] = useState(false)
  const [isSending, setIsSending] = useState(false)
  

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
    setTextArea('')
    setWordCount(0)
    setMarkAsComplete(false)
  }

  const formatDate = (date: Date) => {
    const day = date.getDay();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`
  }

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newResponse = e.target.value
    const words = newResponse.trim().split(/\s+/)
    if (words.length <= 200) {
      setTextArea(newResponse)
      setWordCount(words.length)
    }
  }

  const handleSendResponse = async () => {
    if (selectedTicket && textarea.trim()) {
      setIsSending(true)
      const response = await fetch(`${host}/api/ticket/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          input: selectedTicket.email,
          textarea: textarea,
          solved: markAsComplete ? "Closed": "Open"
        }),
      })
      if(response.ok){
        const updatedTickets = tickets.map(ticket => 
          ticket.ticketId === selectedTicket.ticketId
            ? { ...ticket, status: (markAsComplete ? 'Closed' : 'Open') as Ticket['status'] }
            : ticket
        )
        setTickets(updatedTickets)
        toast('Your response has been sent successfully.')
      }
      else{
        toast('Failed to send response. Please try again later.')
      }
      setIsSending(false)
      setIsModalOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Support Tickets</h1>
          {loading ? (
            <ul className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index}>
                  <TicketSkeleton />
                </li>
              ))}
            </ul>
          ) : tickets.length > 0 ? (
            <ul className="space-y-4">
              {tickets.map((ticket) => (
                <li 
                  key={ticket.ticketId}
                  className="bg-blue-50 border border-blue-100 shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-grow mr-4">{ticket.issue}</p>
                    <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <NoTicketsMessage />
          )}
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-2 border-blue-100">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              Review and respond to the support ticket
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <ScrollArea className="max-h-[calc(100vh-200px)] pr-4">
              <div className="grid gap-2">
                {Object.entries({
                  Issue: selectedTicket.issue,
                  Description: selectedTicket.description,
                  "Submitted by": `${selectedTicket.name} (${selectedTicket.email})`,
                  "Created at": formatDate(new Date(selectedTicket.createdAt))
                }).map(([key, value]) => (
                  <div key={key} className="space-y-1 p-2 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700">{key}</h3>
                    <p className="text-sm text-gray-900">{value}</p>
                  </div>
                ))}
                {selectedTicket.image && (
                  <div className="space-y-1 bg-gray-50 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700">Attached Image</h3>
                    <img 
                      src={selectedTicket.image} 
                      alt="Ticket attachment" 
                      className="rounded-md border max-w-full h-auto mt-2"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Your Response</h3>
                  <Textarea
                    placeholder="Type your response here..."
                    value={textarea}
                    onChange={handleResponseChange}
                    className="min-h-[100px] focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500">{wordCount}/200 words</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markAsComplete"
                    checked={markAsComplete}
                    onCheckedChange={(checked) => setMarkAsComplete(checked as boolean)}
                  />
                  <label
                    htmlFor="markAsComplete"
                    className="text-sm font-medium leading-none"
                  >
                    Mark as complete
                  </label>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendResponse}
              disabled={!textarea.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}