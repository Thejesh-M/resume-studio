export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly onboardingCompleted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
