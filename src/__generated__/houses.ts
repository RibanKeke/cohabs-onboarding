/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: Ex/RG2ZsZoaz5+n0MeRofwi+jZdBEVysIiRpWzdba5EpVNTW2CyS9T/JbC8SbcvDgdZF0PJHj8yozhoB49VoNA==
 */

/* eslint-disable */
// tslint:disable

interface Houses {
  /**
   * @default 1
   */
  active: (boolean | number)
  createdAt: (string | Date)
  /**
   * @default 0
   */
  deleted: (boolean | number)
  id: string & {readonly __brand?: 'houses_id'}
  name: string
  stripeAccountId: (string) | null
  updatedAt: (string | Date)
}
export default Houses;

interface Houses_InsertParameters {
  /**
   * @default 1
   */
  active?: (boolean | number)
  createdAt: (string | Date)
  /**
   * @default 0
   */
  deleted?: (boolean | number)
  id: string & {readonly __brand?: 'houses_id'}
  name: string
  stripeAccountId?: (string) | null
  updatedAt: (string | Date)
}
export type {Houses_InsertParameters}
