export class RoomchatDto {
    public userId: string;
    public member: string[];
    public title: string;
    public isSingle: boolean;   
    public description?: string | null;
    public imgDisplay?: string | null;
    constructor(userId: string, member: [string], title: string, isSingle: boolean, description?: string | null, imgDisplay?: string | null) {
        this.userId = userId;
        this.member = member;
        this.title = title;
        this.isSingle = isSingle;
        this.description = description 
        this.imgDisplay = imgDisplay
    }
}
  