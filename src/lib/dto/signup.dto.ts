export class SignUpDto {
    public email: string;
    public password: string;
    public name: string;
    public birthday?: string | null;
    public phoneNumber?: number | null;
    constructor(email: string, password: string, name: string, birthday?: string | null, phoneNumber?: number | null) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.birthday = birthday 
        this.phoneNumber = phoneNumber
    }
}
  