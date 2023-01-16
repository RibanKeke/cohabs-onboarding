import { ConnectionPool } from "@databases/mysql";
import { anyOf } from "@databases/mysql-typed";
import Stripe from "stripe";
import { Logger } from "tslog";
import { payments } from "../database";

async function updateStripeSubscriptionMissingLink(db: ConnectionPool, stripe: Stripe, commit: boolean): Promise<void> {
    const log = new Logger();
    const payments = (await stripe.paymentIntents.list()).data.filter((value) => value.transfer_group === null);
    console.log('Payments', payments)
}

async function tranferMissingPaymentsTransport(db: ConnectionPool, stripe: Stripe, stripeAccount: string, transferGroup: string, commit: boolean): Promise<void> {
    const log = new Logger();
    const paymentsIntents = (await stripe.paymentIntents.list()).data.filter((value) => value.transfer_group === null);
    const dbPayments = await payments(db).find({ 'stripeChargeId': anyOf(paymentsIntents.map(p => p.id).join(', ')) }).all();

    if (commit) {
        log.warn('Changes submitted to stripe');
        await Promise.all(dbPayments.map(payment => {
            return stripe.transfers.create({
                amount: Number(payment.amount),
                currency: 'eur',
                destination: stripeAccount,
                transfer_group: transferGroup,
            });
        })).then(values => {
            console.log(values);
        }).catch()
    }
    else {
        console.table(dbPayments.map(c => { }));
    }
}

export { updateStripeSubscriptionMissingLink, tranferMissingPaymentsTransport };
