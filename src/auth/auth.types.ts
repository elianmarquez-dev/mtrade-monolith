export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};
