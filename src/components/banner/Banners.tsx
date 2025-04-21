"use client"

import { useState, useRef, useEffect } from "react"
import {  Plus, Trash2, Upload, ImageIcon, Loader2 } from "lucide-react"
import { storage } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import Navbar from "../common/Navbar"
import { uploadFile } from "@/functions/uploadFile"
import { deleteObject, ref } from "firebase/storage"
import { host } from "@/lib/host"
import { toast } from "sonner"
import { useAuthStore } from "@/store/AuthState"



export type BannerType = {bannerId: string, imageUrl: string}

export default function Banners() {
  const [banners, setBanners] = useState<BannerType[]>([])
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null)
  const [editingBanner, setEditingBanner] = useState<{ id: string, title: string } | null>(null)
  const [isAddingBanner, setIsAddingBanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const token = useAuthStore().token

  const [loading, setLoading] = useState(true)



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewBannerFile(event.target.files[0])
    }
  }

  const addBanner = async() => {
    if (newBannerFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Allowed image types
    if (!allowedTypes.includes(newBannerFile.type)) {
    toast('Only JPEG, PNG, or GIF files are allowed.')
     setLoading(false)
     return;
    } 
    setIsAddingBanner(true);
    try {
      // Simulate file upload and getting the uploaded URL
      const uploadedImageUrl = await uploadFile(newBannerFile); // Upload the file and get the URL
      const response = await fetch(`${host}/api/banner/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": token ?? ""
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl
        })
      });

        if(response.status == 200){
        const json = await response.json();
        const uploadedBanner = json.banner

        const newBanner = {
          bannerId: uploadedBanner.bannerId, // Ideally, use a unique ID generator
          imageUrl: uploadedBanner.imageUrl, // Use the URL from the upload
        }; 
        const newBannerArray = Array.isArray(banners) ? [...banners, newBanner] : [newBanner];
        setBanners(newBannerArray);
        setNewBannerFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      
       toast('Your new banner has been successfully added.')
      }
      
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast('There was an error uploading the banner.')
    } finally {
      setIsAddingBanner(false);
    }
    }
  }

  const deleteBanner = async(id: string) => {

    try {
      const response = await fetch(`${host}/api/banner/deletebanner/${id}`, {
        method: "DELETE",
        headers: {
            "authorization": token ?? ""
        }
      })
      if(response.status === 200){
        const json = await response.json();
        const url = json.url
        const filePath = url.split('/o/')[1].split('?')[0]; // Get the path part of the URL
  
      // Create a reference to the file to delete
      const fileRef = ref(storage, decodeURIComponent(filePath));
  
      // Delete the file
       await deleteObject(fileRef);
        setBanners(banners.filter(banner => banner.bannerId !== id))
        toast('The banner has been successfully deleted.')
      }
      else{
        toast('There was an error deleting file.')
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log(error)
      toast('Theere was an error deleting file.')
    }
    
  }

  useEffect(() => {
    fetch(`${host}/api/banner/fetchallbanners`, {
      method: "GET",
    }).then((response) => {
      if(response.status === 200){
        response.json().then((data) => {
          setBanners(data.banners);
        })
      }
      setLoading(false)
    })
  }, [toast])

  useEffect(() => {
    if (isAddingBanner && addButtonRef.current) {
      addButtonRef.current.classList.add('animate-bounce')
      setTimeout(() => {
        if (addButtonRef.current) {
          addButtonRef.current.classList.remove('animate-bounce')
        }
      }, 1000)
    }
  }, [isAddingBanner])

  

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar/>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Banners</h1>
          <Dialog open = {open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={(e) => {e.preventDefault();setOpen(true)}} className={`${banners.length === 0 && 'hidden'}`}>
                <Plus className="mr-2 h-4 w-4" /> Add New Banner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Banner</DialogTitle>
                <DialogDescription>
                  Create a new banner by providing atleast 4-character title and uploading an image or GIF.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image/GIF
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*,.gif"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      {newBannerFile ? newBannerFile.name : "Choose file"}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={addBanner} 
                  disabled={ !newBannerFile || isAddingBanner}
                  ref={addButtonRef}
                >
                  {isAddingBanner ? "Adding..." : "Add Banner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
          {/* {JSON.stringify(banners)} */}
          {loading ? <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>: 
          
          <>
          {banners.length === 0 ? <>
            <Card className="w-full p-6 text-center">
            <CardContent>
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No banners available</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new banner.</p>
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={(e) => {e.preventDefault();setOpen(true)}}>
                      <Plus className="mr-2 h-4 w-4" /> Add New Banner
                    </Button>
                  </DialogTrigger>
                  {/* Dialog content same as above */}
                </Dialog>
              </div>
            </CardContent>
          </Card>
          
          </> : 
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {
            banners.map((banner) => (
              <Card key={banner.bannerId} className="overflow-hidden">
             <CardHeader className="p-0">
               <img
                 src={banner.imageUrl}
                 alt={"Image"}
                 className="w-full h-48 object-cover"
               />
             </CardHeader>
             <CardFooter className="p-4 pt-0 flex justify-between">
               <Dialog>
                 <DialogTrigger asChild>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>Edit Banner</DialogTitle>
                     <DialogDescription>
                       Update the banner title (4 characters max).
                     </DialogDescription>
                   </DialogHeader>
                   <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="edit-title" className="text-right">
                         Title
                       </Label>
                       <Input
                         id="edit-title"
                         value={editingBanner?.title || ""}
                         onChange={(e) => setEditingBanner(prev => prev ? { ...prev, title: e.target.value } : null)}
                         className="col-span-3"
                       />
                     </div>
                   </div>
                 </DialogContent>
               </Dialog>
               <Button variant="destructive" size="sm" onClick={() => deleteBanner(banner.bannerId)}>
                 <Trash2 className="mr-2 h-4 w-4" /> Delete
               </Button>
             </CardFooter>
           </Card>))
          }
        </div>
          }
          </>
        }
      </main>
    </div>
  )
}