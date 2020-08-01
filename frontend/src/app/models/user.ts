import { UserI } from "../../../../common/user";

export class User implements UserI {
  username: string;
  password: string;
  authdata?: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}
