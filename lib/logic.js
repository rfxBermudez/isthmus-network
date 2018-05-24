/**
 * Emisor autoriza que la factura sea descontada
 * @param {org.isthmus.invoice.AcceptDescountInvoice} bill - Bill inserted
 * @transaction
 */
async function acceptDescountInvoice(bill) {
    bill.invoice.status = 'FINANCING';
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.Invoice');
    await assetRegistry.update(bill.invoice);
}

/**
 * Financiera acepta descontar una factura
 * @param {org.isthmus.invoice.DescountInvoice} bill - Bill inserted
 * @transaction
 */
 async function descountInvoice(bill) {
    console.log(bill);
    let assetRegistryDiscount = await getAssetRegistry('org.isthmus.invoice.InvoiceDiscount');
    var factory = getFactory();
    var invoiceDiscount = factory.newResource('org.isthmus.invoice', 'InvoiceDiscount', 'InvoiceDiscount_' + bill.invoice.invoiceId + '-' + bill.financial.userId + '-' + bill.invoice.debtor.userId);
    invoiceDiscount.descountDate = new Date();
    invoiceDiscount.financial = bill.financial;
    invoiceDiscount.status = 'INSERTED';
    //Calculo de porcentaje y monto de descuento
    var days = Math.round( (bill.invoice.expirationDate.getTime() - invoiceDiscount.descountDate.getTime()) / (1000*60*60*24) );
    invoiceDiscount.percentage = (days * bill.invoice.debtor.mensualTax) / 30;
    invoiceDiscount.amount = bill.invoice.amount - (bill.invoice.amount * (invoiceDiscount.percentage / 100));
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
  * Tecnico de plataforma aprueba el descuento de una factura
  * @param {org.isthmus.invoice.ApproveDescountInvoice} bill - Bill inserted
  * @transaction
  */
  async function approveDescountInvoice(bill) {
    bill.invoiceDiscount.status = 'PROCESSED';
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.InvoiceDiscount');
    await assetRegistry.update(bill.invoiceDiscount);
}

/**
 * Tecnico de plataforma realiza el cierre con los calculos de la comisión
 * @param {org.isthmus.invoice.CloseInvoice} bill - Bill inserted
 * @transaction
 */
async function closeInvoice(bill) {
    let totalAmount = bill.invoice.amount - bill.invoiceDiscount.amount;
    bill.invoiceDiscount.commissionTechnical = totalAmount - (totalAmount * (bill.financial.percentageCommission / 100));
    bill.invoiceDiscount.commissionFinancial = totalAmount -  bill.invoiceDiscount.commissionTechnical;
    let assetRegistry = await getAssetRegistry('org.isthmus.invoice.InvoiceDiscount');
    await assetRegistry.update(bill.invoiceDiscount);

    bill.invoice.status = 'PROCESSED';
    let assetRegistryInvoice = await getAssetRegistry('org.isthmus.invoice.Invoice');
    await assetRegistryInvoice.update(bill.invoice);
}