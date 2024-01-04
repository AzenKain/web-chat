import axios from "axios";
import { FileUploadDto } from "./dto";

export async function uploadFile (data: FileUploadDto, authToken: string) {
    try {
        const formData = new FormData();
        formData.append('userId', data.userId);
        formData.append('file', data.file);

        const response = await axios.post('http://103.144.87.14:3434/media/upload', formData, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
        },
        });

        if (response.data == null) return null;
        console.log(response.data)
        return response.data
    } catch (error) {
        console.error('Error:', error);
    }
};