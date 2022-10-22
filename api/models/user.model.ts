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

export interface RegisterUser {
  username: string;
  password: string;
  email: string;
}
