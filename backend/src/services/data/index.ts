export {
  store,
  insertCustomer,
  insertSalesOrder,
  insertDelivery,
  insertInvoice,
  insertPayment,
  insertProduct,
  getCustomer,
  getSalesOrder,
  getDelivery,
  getInvoice,
  getPayment,
  getProduct,
} from './store';

export {
  ingestData,
  type IngestResult,
  type IngestCounts,
} from './data.service';
