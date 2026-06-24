type IRole = any;
type IUser = any;
type IStore = any;
type ITemsConfig = any;
type ICollection = any;
type ICompany = any;
type IUnit = any;
type ItemManagement = any;
type ISupplierManagement = any;
type ISupplierItems = any;
type ICategoryMaster = any;
type IPurchaseOrder = any;
type IInventory = any;
type IPurchaseOrderItems = any;
type IWorkflowConfig = any;
type ISystemMessageConfig = any;
type IStoreStockLevels = any;
type IInventoryTransfer = any;
type ISalesInvoice = any;
type ISalesInvoiceItems = any;
type IPurchaseReturn = any;
type IPurchaseReturnItems = any;

interface INotificationMessage {
  id: string;
  time: number;
  event: string;
  topic: string;
  message: string;
  title?: string;
  priority?: number;
  tags?: string[];
  click?: string;
  attachment?: {
    name: string;
    type: string;
    size: number;
    expires: number;
    url: string;
  };
}

// Company Administration Types
interface ISystemSettings {
  id?: string;
  company_id?: string;
  email_url: string;
  email_token: string;
  created_at?: string;
  modified_at?: string;
}

interface IReportConfig {
  id?: string;
  company_id?: string;
  report_type: string;
  payment_details?: string;
  remarks?: string;
  report_footer?: string;
  created_at?: string;
  modified_at?: string;
}

export type { 
  IRole, 
  IUser, 
  IStore, 
  ITemsConfig, 
  ICollection, 
  ICompany, 
  IUnit, 
  ItemManagement, 
  ISupplierManagement, 
  ISupplierItems, 
  ICategoryMaster, 
  IPurchaseOrder, 
  IInventory, 
  IPurchaseOrderItems, 
  IWorkflowConfig, 
  ISystemMessageConfig, 
  IStoreStockLevels, 
  IInventoryTransfer, 
  ISalesInvoice, 
  ISalesInvoiceItems, 
  IPurchaseReturn, 
  IPurchaseReturnItems, 
  ISystemSettings, 
  IReportConfig, 
  INotificationMessage 
};