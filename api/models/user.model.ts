export interface User {
  id?: number;
  username: string;
  email: string;
  created: Date;
}

export interface UserWithPassword extends User {
  password: string;
  password_salt?: string;
}
