export class SignUpDto {
    public email: string;
    public password: string;
    public name: string;
    public birthday?: Date | null;
    public phoneNumber?: number | null;
    constructor(email: string, password: string, name: string, birthday?: Date | null, phoneNumber?: number | null) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.birthday = birthday 
        this.phoneNumber = phoneNumber
    }
}
  