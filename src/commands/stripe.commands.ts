import { ConnectionPool, sql } from "@databases/mysql";
import prompts from "prompts";
import Stripe from "stripe";
import { Logger } from "tslog";
import { houses } from "../database";

async function listPaymentByHouse(db: ConnectionPool) {
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

/**
 * Create tranfers for payments missing a transfer group in stripe.
 * @param db Connection Pool fo the database,
 * @param stripe Stripe object
 * @param stripeAccount Main stripeAccountId
 */
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
            const originalAmount = charges.find(c => c.id === payment.stripeChargeId)?.amount;
            return stripe.transfers.create({
                amount: originalAmount,
                currency: 'eur',
                description: `Manual transfer from ${payment.houseName} - ${payment.houseName} lease:${payment.leaseId} -> to group: ${house.transferGroup}`,
                destination: payment.stripeAccountId,
                transfer_group: house.transferGroup,
            });
        })).then(values => {
            log.info('SUCCESFULL: All tranfers are executed', values.length);
        }).catch(err => {
            log.error('Failed transfer:', err.message);
        });
    }
    else {
        log.info(`Skipped tranfers operations for ${house.houseName} - tranferGroup:${house.transferGroup} - stripeAccountId:${house.stripeAccountId} - count: ${notTranfered.length}`)
        console.table(notTranfered.map(c => ({ house: c.houseName, amount: c.amount, stripeChargeId: c.stripeChargeId, leaseId: c.leaseId } as Partial<typeof payments[0]>)));
    }
}

export { processMissingTransfersOnCharges };
