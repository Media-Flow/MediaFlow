import { Role } from './constants';

interface UserProps {
  id: string;
  sub: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(
    private readonly _id: string,
    private _sub: string | null,
    private _email: string,
    private _firstName: string,
    private _lastName: string,
    private _role: Role,
    private _isBlocked: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static register(params: {
    id: string;
    sub: string | null;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  }): User {
    const now = new Date();

    return new User(
      params.id,
      params.sub,
      params.email,
      params.firstName,
      params.lastName,
      params.role,
      false,
      now,
      now,
    );
  }

  static fromPersistence(props: UserProps): User {
    return new User(
      props.id,
      props.sub,
      props.email,
      props.firstName,
      props.lastName,
      props.role,
      props.isBlocked,
      props.createdAt,
      props.updatedAt,
    );
  }

  updateProfile(params: { firstName?: string; lastName?: string }): void {
    if (params.firstName !== undefined) {
      this._firstName = params.firstName;
    }

    if (params.lastName !== undefined) {
      this._lastName = params.lastName;
    }

    this._updatedAt = new Date();
  }

  linkExternalIdentity(externalId: string): void {
    this._sub = externalId;
    this._updatedAt = new Date();
  }

  block(): void {
    this._isBlocked = true;
    this._updatedAt = new Date();
  }

  unblock(): void {
    this._isBlocked = false;
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get sub(): string | null {
    return this._sub;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get role(): Role {
    return this._role;
  }

  get isBlocked(): boolean {
    return this._isBlocked;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
