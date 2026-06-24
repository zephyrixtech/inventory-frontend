import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditService } from "@/services/auditService";

const AuditTrail = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    itemsPerPage: 10,
  });

  // Sort state: default to transactionDate descending
  const [sortConfig, setSortConfig] = useState({
    field: "transactionDate",
    direction: "desc",
  });

  // Fetch logs from the API
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await auditService.list({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined,
        scope: scopeFilter !== "all" ? scopeFilter : undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        sortBy: sortConfig.field || undefined,
        sortOrder: sortConfig.direction || undefined,
      });

      if (response && response.data) {
        setRecords(response.data);
        setPagination({
          currentPage: response.meta.page,
          totalPages: response.meta.totalPages,
          total: response.meta.total,
          itemsPerPage: response.meta.limit,
        });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced/Triggered fetching logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, scopeFilter, dateFromFilter, dateToFilter, sortConfig, searchTerm]);

  // Sort icon helper
  const getSortIcon = (field) => {
    if (sortConfig.field !== field)
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    if (sortConfig.direction === "desc")
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
  };

  // Handle sorting
  const handleSort = (field) => {
    let dir = "asc";
    if (sortConfig.field === field) {
      if (sortConfig.direction === "asc") dir = "desc";
      else if (sortConfig.direction === "desc") dir = "asc";
    }
    setSortConfig({ field, direction: dir });
    setCurrentPage(1);
  };

  // Handle state updates that reset pagination page to 1
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleScopeChange = (val) => {
    setScopeFilter(val);
    setCurrentPage(1);
  };

  const handleDateFromChange = (val) => {
    setDateFromFilter(val);
    setCurrentPage(1);
  };

  const handleDateToChange = (val) => {
    setDateToFilter(val);
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSortConfig({ field: "transactionDate", direction: "desc" });
    setSearchTerm("");
    setScopeFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setCurrentPage(1);
  };

  // CSV export
  const exportToCSV = async () => {
    try {
      const response = await auditService.list({
        page: 1,
        limit: 1000,
        search: searchTerm.trim() || undefined,
        scope: scopeFilter !== "all" ? scopeFilter : undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        sortBy: sortConfig.field || undefined,
        sortOrder: sortConfig.direction || undefined,
      });

      if (!response || !response.data || response.data.length === 0) {
        alert("No records to export");
        return;
      }

      const headers = ["Date", "Scope", "Module", "Key", "Log", "IP Address", "Device", "Location", "Action By", "Role"];
      const rows = response.data.map((r) => {
        const formattedDate = r.transactionDate ? format(new Date(r.transactionDate), "yyyy-MM-dd HH:mm") : "";
        const cleanLog = (r.log || "").replace(/"/g, '""');
        return [
          formattedDate,
          r.scope || "",
          r.module || "",
          r.key || "",
          `"${cleanLog}"`,
          r.ipAddress || "",
          r.device || "",
          r.location || "",
          r.actionBy || "",
          r.role || "",
        ];
      });

      // Excel support: add UTF-8 BOM
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV");
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="min-h-[85vh] shadow-sm border-slate-200/80">
          <CardHeader className="rounded-t-lg border-b border-slate-100 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                  <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Audit Trail
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-500">
                    Track all system changes, user updates, and activities
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={records.length === 0}
                  className="hover:bg-slate-50 border-slate-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Filters */}
            <div className="mb-6 flex flex-col xl:flex-row items-center gap-4">
              <div className="relative flex-1 w-full xl:w-1/3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by Log, User, Module, or Key..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <Select
                  value={scopeFilter}
                  onValueChange={(v) => handleScopeChange(v)}
                >
                  <SelectTrigger className="w-[180px] border-slate-200">
                    <SelectValue placeholder="All Scopes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scopes</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Packing List">Packing List</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="User Management">User Management</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="w-[150px] border-slate-200"
                  />
                  <span className="text-slate-400">to</span>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="w-[150px] border-slate-200"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="border-slate-200 hover:bg-slate-50 text-slate-600 ml-auto xl:ml-0"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    {[
                      ["transactionDate", "Transaction Date"],
                      ["scope", "Scope"],
                      ["module", "Module"],
                      ["key", "Key"],
                      ["log", "Log Description"],
                      ["ipAddress", "IP Address"],
                      ["device", "Device"],
                      ["location", "Location"],
                      ["actionBy", "Action By"],
                    ].map(([field, label]) => (
                      <TableHead
                        key={field}
                        className="font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none py-3"
                        onClick={() => handleSort(field)}
                      >
                        <div className="flex items-center gap-1.5">
                          {label} {getSortIcon(field)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j} className="py-4">
                            <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : records.length > 0 ? (
                    records.map((r) => (
                      <TableRow key={r._id || r.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                        <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                          {r.transactionDate ? format(new Date(r.transactionDate), "yyyy-MM-dd HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {r.scope}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{r.module}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{r.key || "-"}</TableCell>
                        <TableCell className="break-words whitespace-pre-wrap max-w-sm text-slate-600 text-sm">
                          {r.log}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{r.ipAddress || "-"}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{r.device || "-"}</TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {r.location || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 text-sm">{r.actionBy}</span>
                            {r.role && (
                              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                                {r.role}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                        No audit records found matching the filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-6 gap-4 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">Show</p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] border-slate-200">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500">entries</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="hidden md:block text-sm text-slate-500">
                  Showing{" "}
                  {records.length > 0 
                    ? (currentPage - 1) * itemsPerPage + 1 
                    : 0}{" "}
                  to {(currentPage - 1) * itemsPerPage + records.length} of{" "}
                  {pagination.total} entries
                </p>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center justify-center text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded select-none">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(p + 1, pagination.totalPages)
                    )
                  }
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditTrail;