
// Import the functions you need from the SDKs you need
import { storage } from '@/lib/firebase';
import {v4} from 'uuid'

import {ref, uploadBytesResumable, getDownloadURL} from 'firebase/storage'


export const uploadFile = async(file: File) => {
    const filename = `${file.name.split('.')[0]}_${v4()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `${filename}`);
    await uploadBytesResumable(storageRef, file);
    const url = await getDownloadURL(storageRef)
    return url
}