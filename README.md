# Cohabs Support Challenge
Proccess tranfers missing transferGroup on stripe charges.
Support case: Dispute payment and Rent not transferred
The purpose of this exercise is to test out your skills on a real-life use case. As you’re interviewing for a support engineer position, it naturally spans over little operations as well as DB and API integration work.

The challenge aims at making sure that we’ve got a clear understanding of your current back-end level and how you resolve a given issue/operation. It’s important that you do your best given the time constraints, so we can transparently assess whether you’re a good fit for the job.

We don’t expect you to know how to resolve the exercise beforehand, but we will evaluate how and why you came to the solution. Please list any assumptions that you made or try and clarify them with us. Just as for our future collaboration, you should not be working in isolation.

We invite you to take enough time to provide a well-crafted solution. We love reports, process, tracking valuable information and the initiative to create documentation. It would be really cool if you could also surprise us**.**

You can found all the related information here:

https://www.notion.so/cohabs/Support-challenge-22bdbbf7563e4c2aa15c8b44dd3df186
Technical case: Sync our database on a fresh Stripe account
We have a dump of our database in this project cohabs_onboarding.dump. To begin can restore this dump. In this fresh database the link between our data and Stripe was missing. The goal of this exercices was to recreate and save the link between our entities and Stripe.

To begin a quick explanation about our database and his structure:

alt text

As you can see, we have an user, signing a lease for a specific rooms. For each of this entities, we want to have the related entities on Stripe:

For each user we want a customer on Stripe containing all the relevant informations contained in our users table.
For each room we want a product with a price on Stripe, you can found the value of the price in the rent column.
For each lease we want an subscription on Stripe making the link between the customer and the product.
The goal was to recreate all the missing entities on Stripe, get the id in the response, and store the related id in our database:

In the users table, you need to store the customer id in stripeCustomerId.
In the rooms table, you need to store the product id in stripeProductId.
In the lease table, you need to store the subscription id in stripeSubscritpionId.

# Analysis
The first step of the process it to check if there is any record out of sync with stripe.
The process will check each record from the three target tables and assign a check status depending on the prerequisites on each table.
The possible check status are:
- missing: Record missing stripe counter-part object id (ex: User with stripCustomerId = null)
- broken: Record has a valid stripe object id but the related object can't be found.
- invalid: Record which didn't pass the prerequisites, not elligible for the sync process. (ex: room with invalid houseId)
- synced: Record already in sync with stripe (not processed in the next steps)
- error: Record that has triggered an error during the check process. Excluded from the next steps of the process

When the checks are completed the update process is triggered depending on the status of the filtered records.
Each sync operation returns an execution status:
- "done": Update completed with success
- "failed": An error was thrown during the update, the error will be reported
- "skipped": The update was skipped, not meeting the prerequisites or the script is executed in simulation mode.
## Users
### Assumptions
Only the active users are elligible for the sync process.
Users flagged as broken are included in the sync process and a new stripe customer is created.

In case a check triggers an error, the related record is skipped from the update process and reported.

Deleted users are reported as broken and are re-created and linked to the user.

Record that triggers an error when checked is excluded from the next steps of the process and reported.
### Solution
Step 1: Check users and return users sorted by status

missing: user without a stripeCustomerId

broken: User with stripeCustomerId but the related object is missing or has been deleted from stripe

error: User has triggered an unexpected error (ex: stripe API call return an rate limit error for example)

synced: User in sync with stripe account

Step 2: Sync each record first on stripe and update the database with stripe results.
In this step, a default payment method is created and attached to the new customer (Required for creating a subscription)
## Rooms
### Assumptions
Only active rooms are included in the sync process.
A room is invalid for the next step of the process if it misses a valid houseId.

Invalid rooms are reported and skipped for the next steps of the process.

In case a check triggers an error, the related record is skipped from the update process and reported.
### Solution
Checks are based on a query including the houseId from the house table (left join), this will detect any room linked to an invalid or missing houseId.

Step 1: Check rooms and return rooms sorted by status

missing: room without a stripeProductId

broken: Room with stripeProductId but the related object is missing or has been deleted from stripe

error: Room has triggered an unexpected error (ex: stripe API call return an rate limit error for example)

synced: Room in sync with stripe

Step 2: Sync each record first on stripe and update the database with stripe results.

## Leases
### Assumptions
Only active leases are included in the sync process.
A lease is invalid for the next step of the process if it's not linked to a valid house, user or room.

Invalid rooms are reported and skipped for the next steps of the process.

In case a check triggers an error, the related record is skipped from the update process and reported.
### Solution
Checks are based on a query (left join) including houseId (house), stripeProductId (room), stripeCustomerId (users).

Step 1: Check leases and return leases sorted by status

invalid: Lease not fulfilling prequisites ( houseId, stripeProductId and stripeCustomerId have to be valid )
missing: Lease without a stripeSubscriptionId
broken: Lease with stripeProductId but the related object is missing or has been deleted from stripe
error: Lease has triggered an unexpected error (ex: stripe API call return an rate limit error for example)
synced: Lease in sync with stripe

Step 2: Sync each record first on stripe and update the database with stripe results.
## Usage
The solution is a CLI with a simple prompt interaction.

/!\ By default the script runs in simulation mode, issues will be detected and reported but all sync actions are skipped and the detected issues are flagged as skipped.

Execution steps:
- Step 1: Script request the user to confirm if the process should be executed in commit mode. In commit mode all detected issues are fixed and saved.

- Step 2:Script requests the user to select the operation ton execute:
  
  - Sync users: Execute the process for the users
  - Sync rooms: Execue the process for the rooms
  - Sync leases: Execute the process for the leases
  - Sync all: Execute in sequence: users -> rooms -> leases

- Step 3: Report
During the script execution, a full report is printed to the standard output.
On completion the script writes a full report, with all steps,the input data and the execution results. The resulting report is saved in the /reports folder with the extension .txt

On non handled error, the script stops, append the error to the existing report and print an error report to /reports with the extension .error
### Limitations
Users already on stripe and not attached on any payment method will fail on the subscription process, this will be reported in details in the script report.

Due to stripe rate limit, some records might fail.
The script doesn't check if a stripe customer has a valid default_payment method and if this method can be attached to a subscription.

For the moment the test coverage is minimal. This tool is aimed to execute batch updates, have a full test coverage is recommended.
### Improvements
- A full code review ;-)
- Improve test coverage
- Check for default payment on each user
- Add transaction and roll-back where necessary (Additional analysis required)
- Add a non-interactive run (cli with args) so the script can be executed on a server and scheduled
- Format generated report into a human readable format
- Send reports by mail or to a webhook when out-of-sync records are detected

## Added libraries and usage
    "@databases/mysql": Typescript mysql client supporting generated types from database schema
    "@databases/mysql-typed": Typescript typing generator
    "prompts": Display interactive prompts to user
    "signale": User friendly console output with a clear indication of the steps and the results.
## Suggestions
UI/UX - CLI - Add the libray oclif (https://oclif.io/)  and implement a full command line interface with arguments.