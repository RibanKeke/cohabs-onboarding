import { ConnectionPool, sql } from "@databases/mysql";
import { anyOf } from "@databases/mysql-typed";
import prompts from "prompts";
import Stripe from "stripe";
import { Logger } from "tslog";
import { houses } from "../database";

async function updateStripeSubscriptionMissingLink(db: ConnectionPool, stripe: Stripe, commit: boolean): Promise<void> {
    const log = new Logger();
    const payments = (await stripe.paymentIntents.list()).data.filter((value) => value.transfer_group === null);
    console.log('Payments', payments)
}

async function listPaymentByHouse(db: ConnectionPool) {
    const housesDefault = [{ name: 'Flagey 10', transferGroup: 'NEW TRANSFER TO FIX PAYMENTS Flagey 10' }, { name: 'Parvis 69', transferGroup: 'NEW TRANSFER TO FIX PAYMENTS PARVIS 69' }];

    const availableHouses = (await houses(db).find().all()).map(c => ({
        houseName: c.name,
        stripeAccountId: c.stripeAccountId,
        transferGroup: `FIX TRANSFER PAYMEMT TO HOUSE ${c.name} - AccountId: ${c.stripeAccountId}`
    }));
    const { choice }: { choice: number } = await prompts<'choice'>({
        type: 'select',
        name: 'choice',
        message: 'Select command to execute',
        choices: availableHouses.map((h, i) => ({ title: h.houseName, description: `Execute tranfers to house ${h.houseName}`, value: i })),
        initial: 0
    })

    const house = availableHouses[choice];

    const dbPayments = await db.query(sql`  select
                                            p.id as paymentId,
                                            p.amount as amount ,
                                            p.stripeChargeId as stripeChargeId ,
                                            hl.leaseId as leaseId,
                                            hl.houseName as houseName,
                                            hl.stripeAccountId
                                        from
                                            payments p
                                        inner join (
                                            select
                                                l.id as leaseId,
                                                h.id as houseId,
                                                h.name as houseName,
                                                h.stripeAccountId
                                            from
                                                leases l
                                            inner join
                                            houses h on
                                                h.id = l.houseId
                                            where
                                                h.name = ${house.houseName} 
                                        ) hl on
                                            p.leaseId = hl.leaseId;`)
    return { payments: dbPayments as Array<{ amount: string, stripeChargeId: string, houseName: string, leaseId: string, stripeAccountId: string }>, house };

}


async function processMissingTransfersOnCharges(db: ConnectionPool, stripe: Stripe, stripeAccount: string): Promise<void> {
    const log = new Logger();
    const charges = (await stripe.charges.list()).data.filter(s => s.transfer_group === null);
    const untransferedChargesIds = charges.map(c => c.id);

    const { payments, house } = await listPaymentByHouse(db);

    const notTranfered = payments.filter(p => untransferedChargesIds.includes(p.stripeChargeId));

    log.warn(`Payments to be transfered ${house.houseName} - count ${notTranfered.length}`);
    console.table(notTranfered);

    const { confirm } = await prompts<'confirm'>({
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm to excute in commit mode, Requests will be sent to Stripe API',
        initial: false
    });
    if (confirm) {
        log.warn('Changes submitted to stripe');
        await Promise.all(notTranfered.map(payment => {
            return stripe.transfers.create({
                amount: Number(payment.amount),
                currency: 'eur',
                description: `Manual transfer from ${payment.houseName} - ${payment.houseName} lease:${payment.leaseId} -> to group: ${payment.stripeChargeId}`,
                destination: stripeAccount,
                transfer_group: house.transferGroup,
            });
        })).then(values => {
            console.log(values);
        }).catch()
    }
    else {
        log.info(`Skipped tranfers operations for ${house.houseName} - tranferGroup:${house.transferGroup} - stripeAccountId:${house.stripeAccountId} - count: ${notTranfered.length}`)
        console.table(notTranfered.map(c => ({ house: c.houseName, amount: c.amount, stripeChargeId: c.stripeChargeId, leaseId: c.leaseId } as Partial<typeof payments[0]>)));
    }
}

export { updateStripeSubscriptionMissingLink, processMissingTransfersOnCharges };
