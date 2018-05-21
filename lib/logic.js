/**
 * Usuario acepta que la factura sea descontada
 * @param {org.isthmus.invoice.AcceptDescountInvoice} bill - Bill inserted
 * @transaction
 */
async function acceptDescountInvoice(bill) {
    bill.invoice.status = 'FINANCING';
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.Invoice');
    await assetRegistry.update(bill.invoice);
}

/**
 * Usuario descuenta una factura
 * @param {org.isthmus.invoice.DescountInvoice} bill - Bill inserted
 * @transaction
 */
 async function descountInvoice(bill) {
    let assetRegistryDiscount = await getAssetRegistry('org.isthmus.invoice.InvoiceDiscount');
    var factory = getFactory();
    var invoiceDiscount = factory.newResource('org.isthmus.invoice', 'InvoiceDiscount', 'InvoiceDiscount_' + bill.invoice.invoiceId + '-' + bill.financial.userId + '-' + bill.invoice.debtor.userId);
    invoiceDiscount.descountDate = new Date();
    invoiceDiscount.amount = 1000;
    invoiceDiscount.percentage = bill.invoice.debtor.mensualTax;
    invoiceDiscount.financial = bill.financial;
    await assetRegistryDiscount.add(invoiceDiscount);
    bill.invoice.status = 'READY';
    bill.invoice.financial = bill.financial;
    if (typeof bill.invoice.discounts === "undefined") {
        bill.invoice.discounts = [];
    }
    bill.invoice.discounts.push(invoiceDiscount)
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.Invoice');
    await assetRegistry.update(bill.invoice);
}

/**
 * Usuario acepta que la factura sea descontada
 * @param {org.isthmus.invoice.CloseInvoice} bill - Bill inserted
 * @transaction
 */
async function closeInvoice(bill) {
    bill.invoice.status = 'PROCESSED';
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.Invoice');
    await assetRegistry.update(bill.invoice);
}