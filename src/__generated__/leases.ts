/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: gnB3Xdb5paTrEnGvAnAAQaIX29UaqbgyGzI7KxAN+Xy60PSAHzo6o+fuKhPmxvOoerlwdG/pGGEIB/q/vK3ZdA==
 */

/* eslint-disable */
// tslint:disable

interface Leases {
  endDate: (string | Date)
  houseId: (string) | null
  id: string & {readonly __brand?: 'leases_id'}
  rentAmount: unknown
  startDate: (string | Date)
  /**
   * @default signed
   */
  status: ("signed" | "void" | "active" | "cancelled" | "finished")
}
export default Leases;

interface Leases_InsertParameters {
  endDate: (string | Date)
  houseId?: (string) | null
  id: string & {readonly __brand?: 'leases_id'}
  rentAmount: unknown
  startDate: (string | Date)
  /**
   * @default signed
   */
  status?: ("signed" | "void" | "active" | "cancelled" | "finished")
}
export type {Leases_InsertParameters}
