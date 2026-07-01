export type MembershipStatus = 'idle' | 'loading' | 'member' | 'non-member'

export type RedeemError = 'invalid-code' | 'unknown'

export type RedeemResult = { ok: true } | { ok: false; error: RedeemError }

export interface InviteDoc {
  familyId: string
}
