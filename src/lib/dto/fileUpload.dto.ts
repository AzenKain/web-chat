export class FileUploadDto {
    userId: string;
    file: File;
    constructor(userId: string, file: File) {
        this.userId = userId;
        this.file = file;
    }
}
  