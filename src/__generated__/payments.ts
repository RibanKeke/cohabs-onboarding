/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: idBlIvk7WynS35noX42KOB1hc+PbdV6U3VvkmYlXwEMNXUtXfKNuprq7ni1Z11X7TfXOrqkt4gv8gdcSAJxuDA==
 */

/* eslint-disable */
// tslint:disable

interface Payments {
  amount: unknown
  comment: (string) | null
  createdAt: (string | Date)
  /**
   * @default 0
   */
  disputed: (boolean | number)
  dueDate: (string | Date)
  id: string & {readonly __brand?: 'payments_id'}
  leaseId: string
  /**
   * @default 0.00
   */
  paid: unknown
  paymentDate: ((string | Date)) | null
  /**
   * @default 0
   */
  pending: (boolean | number)
  /**
   * @default 0
   */
  retries: number
  stripeChargeId: (string) | null
  stripeInvoiceId: (string) | null
  updatedAt: (string | Date)
  userId: (string) | null
}
export default Payments;

interface Payments_InsertParameters {
  amount: unknown
  comment?: (string) | null
  createdAt: (string | Date)
  /**
   * @default 0
   */
  disputed?: (boolean | number)
  dueDate: (string | Date)
  id: string & {readonly __brand?: 'payments_id'}
  leaseId: string
  /**
   * @default 0.00
   */
  paid?: unknown
  paymentDate?: ((string | Date)) | null
  /**
   * @default 0
   */
  pending?: (boolean | number)
  /**
   * @default 0
   */
  retries?: number
  stripeChargeId?: (string) | null
  stripeInvoiceId?: (string) | null
  updatedAt: (string | Date)
  userId?: (string) | null
}
export type {Payments_InsertParameters}
