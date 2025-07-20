"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id, Doc } from "../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
    Eye,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Filter,
    Download,
    Search,
    User,
    Building,
    Phone,
    MapPin,
    Calendar,
    Package,
    FileText,
    Send,
    Loader2,
    MessageSquare,
    RotateCcw,
    Users,
    Calculator,
    DollarSign,
    FileCheck,
    Shield
} from "lucide-react"
import { sendQuotationEmail } from "@/lib/quotation-email-service" // Uses Gmail API
import QuotationMessageThread from "./quotation-message-thread"
import { useAuth } from "@/contexts/auth-context"

// Helper Functions for UI
function getStatusIcon(status: string) {
    switch (status) {
        case "pending": return <Clock className="h-3 w-3" />
        case "processing": return <AlertCircle className="h-3 w-3" />
        case "quoted": return <CheckCircle className="h-3 w-3" />
        case "accepted": return <CheckCircle className="h-3 w-3" />
        case "rejected": return <XCircle className="h-3 w-3" />
        case "expired": return <AlertCircle className="h-3 w-3" />
        default: return <Clock className="h-3 w-3" />
    }
}

function getStatusBadgeStyles(status: string): string {
    switch (status) {
        case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "processing": return "bg-blue-100 text-blue-800 border-blue-200"
        case "quoted": return "bg-green-100 text-green-800 border-green-200"
        case "accepted": return "bg-emerald-100 text-emerald-800 border-emerald-200"
        case "rejected": return "bg-red-100 text-red-800 border-red-200"
        case "expired": return "bg-gray-100 text-gray-800 border-gray-200"
        default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

// GST Calculation Functions
function calculateGSTAmount(subtotal: string, rate: string): string {
    const sub = parseFloat(subtotal || "0");
    const r = parseFloat(rate || "0");
    return (sub * r / 100).toFixed(2);
}

function calculateGSTTotals(subtotal: string, cgstRate: string, sgstRate: string, igstRate: string) {
    const sub = parseFloat(subtotal || "0");
    const cgst = parseFloat(cgstRate || "0");
    const sgst = parseFloat(sgstRate || "0");
    const igst = parseFloat(igstRate || "0");

    const cgstAmount = sub * cgst / 100;
    const sgstAmount = sub * sgst / 100;
    const igstAmount = sub * igst / 100;

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = sub + totalTax;

    return {
        subtotal: sub.toFixed(2),
        cgstAmount: cgstAmount.toFixed(2),
        sgstAmount: sgstAmount.toFixed(2),
        igstAmount: igstAmount.toFixed(2),
        totalTax: totalTax.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
    };
}

// Use the actual Convex document type
type Quotation = Doc<"quotations">

// Define the admin response interface to match the email service
interface AdminResponse {
    quotedBy: string
    quotedAt: number
    totalAmount?: string
    validUntil?: number
    terms?: string
    notes?: string
    gstDetails?: {
        subtotal: number
        cgstRate: number
        sgstRate: number
        igstRate: number
        cgstAmount: number
        sgstAmount: number
        igstAmount: number
        totalTax: number
    }
}

// Define product interface for compatibility
interface QuotationProduct {
    productId: string
    productName: string
    quantity: string
    unit: string
    specifications?: string
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    quoted: "bg-green-100 text-green-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800"
}

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    processing: <AlertCircle className="h-4 w-4" />,
    quoted: <CheckCircle className="h-4 w-4" />,
    accepted: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    expired: <XCircle className="h-4 w-4" />
}

const urgencyColors: Record<string, string> = {
    standard: "bg-gray-100 text-gray-800",
    urgent: "bg-orange-100 text-orange-800",
    asap: "bg-red-100 text-red-800"
}

export default function QuotationManagement() {
    const { admin } = useAuth()
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
    const [showMessageThread, setShowMessageThread] = useState(false)
    const [responseForm, setResponseForm] = useState({
        subtotal: "",
        cgstRate: "0",
        sgstRate: "0",
        igstRate: "0",
        totalAmount: "",
        validUntil: "",
        terms: "",
        notes: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Auto-calculate total amount when subtotal or GST rates change
    React.useEffect(() => {
        if (responseForm.subtotal) {
            const gstTotals = calculateGSTTotals(
                responseForm.subtotal,
                responseForm.cgstRate,
                responseForm.sgstRate,
                responseForm.igstRate
            )
            setResponseForm(prev => ({ 
                ...prev, 
                totalAmount: gstTotals.grandTotal 
            }))
        } else {
            setResponseForm(prev => ({ ...prev, totalAmount: "" }))
        }
    }, [responseForm.subtotal, responseForm.cgstRate, responseForm.sgstRate, responseForm.igstRate])

    // Convex queries and mutations
    const quotations = useQuery(api.quotations.getAllQuotations, {
        limit: 100,
        offset: 0,
        status: selectedStatus === "all" ? undefined : selectedStatus as any
    })

    const quotationStats = useQuery(api.quotations.getQuotationStats)
    const updateQuotationStatus = useMutation(api.quotations.updateQuotationStatus)
    const updateQuotationUrgency = useMutation(api.quotations.updateQuotationUrgency)

    // Helper function to get products from either products or lineItems
    const getQuotationProducts = (quotation: Quotation): QuotationProduct[] => {
        if (quotation.lineItems && quotation.lineItems.length > 0) {
            return quotation.lineItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity.toString(),
                unit: item.unit,
                specifications: item.specifications
            }))
        }
        if (quotation.products && quotation.products.length > 0) {
            return quotation.products.map(product => ({
                productId: product.productId,
                productName: product.productName,
                quantity: product.quantity,
                unit: product.unit,
                specifications: product.specifications
            }))
        }
        return []
    }

    // Filter quotations based on search term
    const filteredQuotations = React.useMemo(() => {
        if (!quotations || !Array.isArray(quotations)) {
            return []
        }

        return quotations.filter(quotation => {
            const products = getQuotationProducts(quotation)
            return quotation?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quotation?.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quotation?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (products && Array.isArray(products) && products.some(product =>
                    product?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
                ))
        })
    }, [quotations, searchTerm])

    const handleStatusUpdate = async (quotationId: Id<"quotations">, newStatus: string) => {
        try {
            setIsSubmitting(true)

            // Validate required fields for quoted status
            if (newStatus === "quoted") {
                if (!responseForm.subtotal || !responseForm.validUntil) {
                    toast.error("Subtotal and valid until date are required for quoted status")
                    setIsSubmitting(false)
                    return
                }
            }

            await updateQuotationStatus({
                quotationId,
                status: newStatus as "draft" | "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired" | "closed" | "revised",
                performedBy: "Admin",
                notes: responseForm.notes || undefined,
                totalAmount: newStatus === "quoted" ? responseForm.totalAmount : undefined,
                validUntil: newStatus === "quoted" ? responseForm.validUntil : undefined,
                terms: newStatus === "quoted" ? responseForm.terms : undefined,
                gstDetails: newStatus === "quoted" ? {
                    subtotal: parseFloat(responseForm.subtotal || "0"),
                    cgstRate: parseFloat(responseForm.cgstRate || "0"),
                    sgstRate: parseFloat(responseForm.sgstRate || "0"),
                    igstRate: parseFloat(responseForm.igstRate || "0"),
                    cgstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.cgstRate)),
                    sgstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.sgstRate)),
                    igstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.igstRate)),
                    totalTax: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.cgstRate)) + parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.sgstRate)) + parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.igstRate))
                } : undefined,
            })

            // Send email notification
            if (selectedQuotation) {
                try {
                    const adminResponse = newStatus === "quoted" ? {
                        quotedBy: "Admin",
                        quotedAt: Date.now(),
                        totalAmount: responseForm.totalAmount,
                        validUntil: responseForm.validUntil ? new Date(responseForm.validUntil).getTime() : undefined,
                        terms: responseForm.terms,
                        notes: responseForm.notes,
                        gstDetails: {
                            subtotal: parseFloat(responseForm.subtotal || "0"),
                            cgstRate: parseFloat(responseForm.cgstRate || "0"),
                            sgstRate: parseFloat(responseForm.sgstRate || "0"),
                            igstRate: parseFloat(responseForm.igstRate || "0"),
                            cgstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.cgstRate)),
                            sgstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.sgstRate)),
                            igstAmount: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.igstRate)),
                            totalTax: parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.cgstRate)) + parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.sgstRate)) + parseFloat(calculateGSTAmount(responseForm.subtotal, responseForm.igstRate))
                        }
                    } : undefined

                    // Convert Convex document to email service format
                    const emailQuotation = {
                        _id: selectedQuotation._id,
                        userId: selectedQuotation.userId,
                        userEmail: selectedQuotation.userEmail,
                        userName: selectedQuotation.userName,
                        userPhone: selectedQuotation.userPhone,
                        businessName: selectedQuotation.businessName,
                        products: getQuotationProducts(selectedQuotation),
                        additionalRequirements: selectedQuotation.additionalRequirements,
                        deliveryLocation: selectedQuotation.deliveryTerms?.deliveryLocation || "",
                        urgency: selectedQuotation.urgency || "standard",
                        status: newStatus as "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired",
                        adminResponse: selectedQuotation.adminResponse,
                        createdAt: selectedQuotation.createdAt,
                        updatedAt: selectedQuotation.updatedAt
                    }

                    const emailResult = await sendQuotationEmail({
                        quotation: emailQuotation,
                        status: newStatus as "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired",
                        adminResponse
                    })

                    if (emailResult.success) {
                        toast.success(`Quotation ${newStatus} and email sent successfully!`)
                    } else {
                        toast.success(`Quotation ${newStatus} successfully!`)
                        toast.warning(`Email notification failed: ${emailResult.message}`)
                    }
                } catch (emailError) {
                    console.error("Email sending error:", emailError)
                    toast.success(`Quotation ${newStatus} successfully!`)
                    toast.warning("Email notification failed to send")
                }
            }

            setIsResponseDialogOpen(false)
            setResponseForm({
                subtotal: "",
                cgstRate: "0",
                sgstRate: "0",
                igstRate: "0",
                totalAmount: "",
                validUntil: "",
                terms: "",
                notes: ""
            })

        } catch (error) {
            console.error("Error updating quotation:", error)
            toast.error("Failed to update quotation")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleViewQuotation = (quotation: Quotation) => {
        setSelectedQuotation(quotation)
        setShowMessageThread(false) // Reset message thread state
        setIsDialogOpen(true)
    }

    const handleQuoteResponse = (quotation: Quotation) => {
        setSelectedQuotation(quotation)
        setIsResponseDialogOpen(true)
        setResponseForm({
            subtotal: "",
            cgstRate: "0",
            sgstRate: "0",
            igstRate: "0",
            totalAmount: "",
            validUntil: "",
            terms: "",
            notes: ""
        })
    }

    const handleReopenQuotation = async (quotationId: Id<"quotations">) => {
        try {
            setIsSubmitting(true)
            await updateQuotationStatus({
                quotationId,
                status: "processing",
                performedBy: "Admin",
                notes: "Quotation reopened for reconsideration",
            })
            toast.success("Quotation reopened successfully")
        } catch (error) {
            console.error("Error reopening quotation:", error)
            toast.error("Failed to reopen quotation")
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const exportQuotations = () => {
        try {
            if (!filteredQuotations || filteredQuotations.length === 0) {
                toast.warning("No quotations to export")
                return
            }

            const csv = [
                // Header
                ["ID", "User", "Email", "Business", "Products", "Status", "Created", "Updated"].join(","),
                // Data
                ...filteredQuotations.map(q => {
                    if (!q) return ""
                    const products = getQuotationProducts(q)
                    return [
                        q._id || "",
                        (q.userName || "").replace(/,/g, ";"), // Replace commas to avoid CSV issues
                        q.userEmail || "",
                        (q.businessName || "").replace(/,/g, ";"),
                        products.length,
                        q.status || "",
                        q.createdAt ? formatDate(q.createdAt) : "",
                        q.updatedAt ? formatDate(q.updatedAt) : ""
                    ].join(",")
                }).filter(row => row !== "")
            ].join("\n")

            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `quotations-${new Date().toISOString().split("T")[0]}.csv`
            link.click()

            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 100)

            toast.success(`Exported ${filteredQuotations.length} quotations`)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export quotations")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quotation Management</h1>
                    <p className="text-muted-foreground">
                        Manage customer quotation requests and send responses
                    </p>
                </div>
                <Button onClick={exportQuotations} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {quotationStats === undefined ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                quotationStats.total || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {quotationStats?.recentRequests || 0} in last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {quotationStats === undefined ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                quotationStats.pending || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processing</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {quotationStats === undefined ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                quotationStats.processing || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Under review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quoted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {quotationStats === undefined ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                quotationStats.quoted || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Quotes sent
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Quotation Requests</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search quotations..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="quoted">Quoted</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Business</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Urgency</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations === undefined ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        <p className="text-muted-foreground">Loading quotations...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredQuotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <p className="text-muted-foreground">
                                            {searchTerm || selectedStatus !== "all"
                                                ? "No quotations match your filters"
                                                : "No quotations found"}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredQuotations.map((quotation) => {
                                    if (!quotation) return null

                                    return (
                                        <TableRow key={quotation._id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{quotation.userName || "Unknown"}</div>
                                                    <div className="text-sm text-muted-foreground">{quotation.userEmail || "No email"}</div>
                                                    {quotation.userPhone && (
                                                        <div className="text-sm text-muted-foreground">{quotation.userPhone}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {quotation.businessName ? (
                                                    <div className="flex items-center space-x-2">
                                                        <Building className="h-4 w-4" />
                                                        <span>{quotation.businessName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Individual</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {(() => {
                                                        const products = getQuotationProducts(quotation)
                                                        return (
                                                            <>
                                                                <div className="text-sm font-medium">
                                                                    {products.length > 0 ? `${products.length} items` : "0 items"}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {products.length > 0 ? (
                                                                        <>
                                                                            {products.slice(0, 2).map(p => p.productName || "Unknown").join(", ")}
                                                                            {products.length > 2 && "..."}
                                                                        </>
                                                                    ) : (
                                                                        "No products"
                                                                    )}
                                                                </div>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[quotation.status || "pending"]}>
                                                    {statusIcons[quotation.status || "pending"]}
                                                    <span className="ml-1 capitalize">{quotation.status || "pending"}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={urgencyColors[quotation.urgency || "standard"]}>
                                                    {(quotation.urgency || "standard").toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {quotation.createdAt ? formatDate(quotation.createdAt) : "Unknown"}
                                            </TableCell>
                                            <TableCell className="min-w-[250px]">
                                                <div className="space-y-2">
                                                    {/* Thread Status Indicator */}
                                                    {(quotation.threadStatus === "active" || quotation.threadStatus === "awaiting_user_permission") && (
                                                        <div className="flex items-center justify-start mb-2">
                                                            {quotation.threadStatus === "active" && (
                                                                <div className="flex items-center gap-1 text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    <span className="font-medium">Active Chat</span>
                                                                </div>
                                                            )}
                                                            {quotation.threadStatus === "awaiting_user_permission" && (
                                                                <div className="flex items-center gap-1 text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                                    <Users className="h-3 w-3" />
                                                                    <span className="font-medium">Awaiting User</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Primary Actions Row */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewQuotation(quotation)}
                                                            title="View Details"
                                                            className="flex items-center gap-1 hover:bg-gray-50"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>

                                                        {/* Quick Message Button for Active Threads */}
                                                        {quotation.threadStatus === "active" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    handleViewQuotation(quotation)
                                                                    setTimeout(() => {
                                                                        const messagesTab = document.querySelector('[value="messages"]') as HTMLElement
                                                                        if (messagesTab) messagesTab.click()
                                                                    }, 100)
                                                                }}
                                                                title="Open Message Thread"
                                                                className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                                            >
                                                                <MessageSquare className="h-3.5 w-3.5" />
                                                                <span className="hidden sm:inline">Chat</span>
                                                            </Button>
                                                        )}

                                                        {/* Status-based Actions */}
                                                        {quotation.status === "pending" && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(quotation._id, "processing")}
                                                                    title="Start Processing"
                                                                    className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                                                >
                                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                                    <span className="hidden md:inline">Process</span>
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleQuoteResponse(quotation)}
                                                                    title="Send Quote"
                                                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                    <span className="hidden md:inline">Quote</span>
                                                                </Button>
                                                            </>
                                                        )}

                                                        {quotation.status === "processing" && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleQuoteResponse(quotation)}
                                                                title="Send Quote"
                                                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <Mail className="h-3.5 w-3.5" />
                                                                <span className="hidden md:inline">Send Quote</span>
                                                            </Button>
                                                        )}

                                                        {quotation.status === "rejected" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleReopenQuotation(quotation._id)}
                                                                disabled={isSubmitting}
                                                                title="Reopen for reconsideration"
                                                                className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50"
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                <span className="hidden md:inline">Reopen</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Quotation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Quotation Details</DialogTitle>
                        <DialogDescription>
                            Complete quotation request information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedQuotation && (
                        <div className="space-y-6">
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="details" className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Details
                                    </TabsTrigger>
                                    <TabsTrigger value="products" className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Products
                                    </TabsTrigger>
                                    <TabsTrigger value="response" className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Response
                                    </TabsTrigger>
                                    <TabsTrigger value="messages" className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Messages
                                        {selectedQuotation?.threadStatus === "active" && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        )}
                                        {selectedQuotation?.threadStatus === "awaiting_user_permission" && (
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* --- ENHANCED TABS CONTENT --- */}
                                <TabsContent value="details" className="space-y-6">
                                    {/* Customer Summary Card */}
                                    <Card className="border border-border bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="h-5 w-5 text-primary" />
                                                <span className="text-foreground">Customer Information</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-primary" />
                                                        <span className="font-medium text-foreground">{selectedQuotation.userName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm text-foreground">{selectedQuotation.userEmail}</span>
                                                    </div>
                                                    {selectedQuotation.userPhone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-orange-600" />
                                                            <span className="text-sm text-foreground">{selectedQuotation.userPhone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedQuotation.businessName && (
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-4 w-4 text-purple-600" />
                                                            <span className="font-medium text-foreground">{selectedQuotation.businessName}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-indigo-600" />
                                                        <span className="text-sm text-foreground">{getQuotationProducts(selectedQuotation).length} items requested</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={urgencyColors[selectedQuotation.urgency || "standard"]}>
                                                            <span className="text-foreground">{(selectedQuotation.urgency || "standard").toUpperCase()}</span>
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    {/* Additional Requirements */}
                                    {selectedQuotation.additionalRequirements && (
                                        <Card className="border border-yellow-200 bg-muted">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <FileText className="h-5 w-5 text-yellow-600" />
                                                    <span className="text-foreground">Additional Requirements</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="p-4 rounded-lg border border-yellow-100 bg-card">
                                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                                        {selectedQuotation.additionalRequirements}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="products" className="space-y-6">
                                    {(() => {
                                        const products = getQuotationProducts(selectedQuotation)
                                        return products.length > 0 ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                                        <Package className="h-5 w-5 text-primary" />
                                                        Requested Products ({products.length})
                                                    </h4>
                                                    <Badge className="bg-muted text-primary border border-border">
                                                        {products.length} item{products.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                </div>
                                                <div className="grid gap-4">
                                                    {products.map((product, index) => (
                                                        <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow">
                                                            <CardContent className="p-6">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="md:col-span-2">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                                                                                <Package className="h-4 w-4 text-primary" />
                                                                            </div>
                                                                            <div className="space-y-1 flex-1">
                                                                                <h5 className="font-semibold text-lg text-foreground">
                                                                                    {product.productName || "Unknown Product"}
                                                                                </h5>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Product #{product.productId || 'N/A'}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {product.specifications && (
                                                                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                                                                <Label className="text-sm font-medium text-foreground">
                                                                                    Technical Specifications
                                                                                </Label>
                                                                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                                                                    {product.specifications}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        <div className="bg-muted p-4 rounded-lg border border-green-100">
                                                                            <div className="text-center">
                                                                                <Label className="text-xs text-green-700 font-medium">
                                                                                    QUANTITY REQUESTED
                                                                                </Label>
                                                                                <div className="mt-1">
                                                                                    <span className="text-2xl font-bold text-green-800">
                                                                                        {product.quantity || "0"}
                                                                                    </span>
                                                                                    <span className="ml-2 text-sm text-foreground">{product.unit}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-medium text-foreground mb-2">No Products Found</h3>
                                                <p className="text-muted-foreground">This quotation request doesn't contain any product information.</p>
                                            </div>
                                        )
                                    })()}
                                </TabsContent>

                                <TabsContent value="response" className="space-y-6">
                                    {selectedQuotation.adminResponse ? (
                                        <div className="space-y-6">
                                            {/* Quote Header */}
                                            <Card className="border border-green-200 bg-card">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                        <span className="text-foreground">Official Quotation Response</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-muted rounded-lg">
                                                                    <User className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Quoted By</p>
                                                                    <p className="font-semibold text-foreground">{selectedQuotation.adminResponse.quotedBy}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-muted rounded-lg">
                                                                    <Calendar className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Quote Date</p>
                                                                    <p className="font-semibold text-foreground">{formatDate(selectedQuotation.adminResponse.quotedAt)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {selectedQuotation.adminResponse.totalAmount && (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-muted rounded-lg">
                                                                        <DollarSign className="h-4 w-4 text-green-700" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground">Total Amount</p>
                                                                        <p className="font-bold text-2xl text-green-800">₹{selectedQuotation.adminResponse.totalAmount}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedQuotation.adminResponse.validUntil && (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-muted rounded-lg">
                                                                        <Clock className="h-4 w-4 text-orange-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground">Valid Until</p>
                                                                        <p className="font-semibold text-foreground">{formatDate(selectedQuotation.adminResponse.validUntil)}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            {/* GST Breakdown */}
                                            {selectedQuotation.adminResponse.gstDetails && (
                                                <Card className="mt-4 border border-purple-200 bg-card">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <Calculator className="h-5 w-5 text-purple-600" />
                                                            <span className="text-foreground">GST Breakdown</span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Subtotal:</span>
                                                                        <span className="font-medium">₹{selectedQuotation.adminResponse.gstDetails.subtotal.toFixed(2)}</span>
                                                                    </div>
                                                                    {selectedQuotation.adminResponse.gstDetails.cgstRate > 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">CGST ({selectedQuotation.adminResponse.gstDetails.cgstRate}%):</span>
                                                                            <span className="font-medium">₹{selectedQuotation.adminResponse.gstDetails.cgstAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {selectedQuotation.adminResponse.gstDetails.sgstRate > 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">SGST ({selectedQuotation.adminResponse.gstDetails.sgstRate}%):</span>
                                                                            <span className="font-medium">₹{selectedQuotation.adminResponse.gstDetails.sgstAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {selectedQuotation.adminResponse.gstDetails.igstRate > 0 && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">IGST ({selectedQuotation.adminResponse.gstDetails.igstRate}%):</span>
                                                                            <span className="font-medium">₹{selectedQuotation.adminResponse.gstDetails.igstAmount.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="border-l border-border pl-4">
                                                                    <div className="bg-muted p-3 rounded-lg border border-green-100">
                                                                        <div className="flex justify-between font-semibold text-green-800">
                                                                            <span>Final Amount:</span>
                                                                            <span>₹{selectedQuotation.adminResponse.totalAmount}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm text-green-700 mt-1">
                                                                            <span>Total Tax:</span>
                                                                            <span>₹{selectedQuotation.adminResponse.gstDetails.totalTax.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                            {/* Terms & Conditions */}
                                            {selectedQuotation.adminResponse.terms && (
                                                <Card className="border border-blue-200 bg-card mt-4">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <FileCheck className="h-5 w-5 text-blue-600" />
                                                            <span className="text-foreground">Terms & Conditions</span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="p-4 rounded-lg border border-blue-100 bg-muted">
                                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                                {selectedQuotation.adminResponse.terms}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                            {/* Additional Notes */}
                                            {selectedQuotation.adminResponse.notes && (
                                                <Card className="border border-purple-200 bg-card mt-4">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <MessageSquare className="h-5 w-5 text-purple-600" />
                                                            <span className="text-foreground">Additional Notes</span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="p-4 rounded-lg border border-purple-100 bg-muted">
                                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                                {selectedQuotation.adminResponse.notes}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                                            </div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">No Response Yet</h3>
                                            <p className="text-muted-foreground mb-4">This quotation is still being processed by our team.</p>
                                            <Badge className="bg-muted text-yellow-800 border border-yellow-200">
                                                Awaiting Response
                                            </Badge>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="messages" className="space-y-4">
                                    {selectedQuotation && admin && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    Communication Thread with {selectedQuotation.userName}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {selectedQuotation.threadStatus && (
                                                        <Badge className={
                                                            selectedQuotation.threadStatus === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : selectedQuotation.threadStatus === "awaiting_user_permission"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : selectedQuotation.threadStatus === "closed"
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                        }>
                                                            {selectedQuotation.threadStatus.replace('_', ' ').toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <QuotationMessageThread
                                                quotationId={selectedQuotation._id}
                                                adminId={admin._id}
                                                adminName={`${admin.firstName} ${admin.lastName}`.trim() || admin.firstName || "Admin"}
                                                onClose={() => setShowMessageThread(false)}
                                            />
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Enhanced Send Quote Dialog */}
            <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Send className="h-5 w-5 text-green-600" />
                                Send Quotation Response
                            </div>
                            {selectedQuotation && (
                                <div className="flex gap-2 mr-5">
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                        ID: {selectedQuotation._id}
                                    </Badge>
                                </div>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Create a comprehensive quotation response with pricing, terms, and GST details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedQuotation && (
                        <div className="space-y-6">
                            {/* Customer Summary Card */}
                            <Card className="border border-border bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <span className="text-foreground">Customer Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{selectedQuotation.userName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">{selectedQuotation.userEmail}</span>
                                            </div>
                                            {selectedQuotation.userPhone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-orange-600" />
                                                    <span className="text-sm">{selectedQuotation.userPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {selectedQuotation.businessName && (
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-purple-600" />
                                                    <span className="font-medium">{selectedQuotation.businessName}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-indigo-600" />
                                                <span className="text-sm">{getQuotationProducts(selectedQuotation).length} items requested</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={urgencyColors[selectedQuotation.urgency || "standard"]}>
                                                    {(selectedQuotation.urgency || "standard").toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product Summary */}
                            <Card className="border-blue-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        Product Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {getQuotationProducts(selectedQuotation).map((product, idx) => (
                                            <div key={idx} className="flex items-center gap-4 border-b last:border-b-0 py-2">
                                                <span className="font-medium">{product.productName}</span>
                                                <span className="text-xs text-gray-500">#{product.productId}</span>
                                                <span className="ml-auto text-green-700 font-semibold">{product.quantity} {product.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pricing Section */}
                            <Card className="border-green-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        Pricing Information
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        Set the base price and validity period for this quotation
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="subtotal" className="flex items-center gap-2 text-base font-medium">
                                                <Calculator className="h-4 w-4 text-green-600" />
                                                Subtotal Amount (₹) *
                                            </Label>
                                            <Input
                                                id="subtotal"
                                                type="number"
                                                placeholder="Enter base amount (e.g., 50000.00)"
                                                value={responseForm.subtotal}
                                                onChange={(e) => {
                                                    const subtotal = e.target.value;
                                                    setResponseForm(prev => ({ ...prev, subtotal }));
                                                }}
                                                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="totalAmount" className="flex items-center gap-2 text-base font-medium">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                Final Amount (₹) - Auto Calculated
                                            </Label>
                                            <Input
                                                id="totalAmount"
                                                type="number"
                                                placeholder="Will be calculated automatically"
                                                value={responseForm.totalAmount}
                                                readOnly
                                                className="bg-gray-50 cursor-not-allowed [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                This amount is automatically calculated based on subtotal and GST rates
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="validUntil" className="flex items-center gap-2 text-base font-medium">
                                                <Calendar className="h-4 w-4 text-orange-600" />
                                                Valid Until *
                                            </Label>
                                            <Input
                                                id="validUntil"
                                                type="date"
                                                value={responseForm.validUntil}
                                                onChange={(e) => setResponseForm(prev => ({ ...prev, validUntil: e.target.value }))}
                                            />
                                            <p className="text-xs text-muted-foreground">Expiration date for this quotation</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* GST Configuration */}
                            <Card className="border-purple-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        GST Configuration
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        Configure applicable GST rates based on customer location and product category
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="cgstRate" className="text-sm font-medium">Central GST (%)</Label>
                                            <Select value={responseForm.cgstRate} onValueChange={(value) => setResponseForm(prev => ({ ...prev, cgstRate: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select CGST" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0% (Exempt)</SelectItem>
                                                    <SelectItem value="2.5">2.5%</SelectItem>
                                                    <SelectItem value="6">6%</SelectItem>
                                                    <SelectItem value="9">9%</SelectItem>
                                                    <SelectItem value="14">14%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sgstRate" className="text-sm font-medium">State GST (%)</Label>
                                            <Select value={responseForm.sgstRate} onValueChange={(value) => setResponseForm(prev => ({ ...prev, sgstRate: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select SGST" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0% (Exempt)</SelectItem>
                                                    <SelectItem value="2.5">2.5%</SelectItem>
                                                    <SelectItem value="6">6%</SelectItem>
                                                    <SelectItem value="9">9%</SelectItem>
                                                    <SelectItem value="14">14%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="igstRate" className="text-sm font-medium">Integrated GST (%)</Label>
                                            <Select value={responseForm.igstRate} onValueChange={(value) => setResponseForm(prev => ({ ...prev, igstRate: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select IGST" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0% (Exempt)</SelectItem>
                                                    <SelectItem value="5">5%</SelectItem>
                                                    <SelectItem value="12">12%</SelectItem>
                                                    <SelectItem value="18">18%</SelectItem>
                                                    <SelectItem value="28">28%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    {/* Calculation Breakdown */}
                                    {responseForm.subtotal && (
                                        <div className="mt-6 p-4 bg-gray-800 rounded-lg border">
                                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                                <Calculator className="h-4 w-4 text-purple-600" />
                                                Calculation Breakdown
                                            </h4>
                                            {(() => {
                                                const gstTotals = calculateGSTTotals(
                                                    responseForm.subtotal,
                                                    responseForm.cgstRate,
                                                    responseForm.sgstRate,
                                                    responseForm.igstRate
                                                )
                                                return (
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Subtotal:</span>
                                                            <span>₹{gstTotals.subtotal}</span>
                                                        </div>
                                                        {parseFloat(responseForm.cgstRate) > 0 && (
                                                            <div className="flex justify-between text-blue-600">
                                                                <span>CGST ({responseForm.cgstRate}%):</span>
                                                                <span>₹{gstTotals.cgstAmount}</span>
                                                            </div>
                                                        )}
                                                        {parseFloat(responseForm.sgstRate) > 0 && (
                                                            <div className="flex justify-between text-blue-600">
                                                                <span>SGST ({responseForm.sgstRate}%):</span>
                                                                <span>₹{gstTotals.sgstAmount}</span>
                                                            </div>
                                                        )}
                                                        {parseFloat(responseForm.igstRate) > 0 && (
                                                            <div className="flex justify-between text-blue-600">
                                                                <span>IGST ({responseForm.igstRate}%):</span>
                                                                <span>₹{gstTotals.igstAmount}</span>
                                                            </div>
                                                        )}
                                                        <div className="border-t pt-2 flex justify-between font-semibold text-green-700">
                                                            <span>Total Tax:</span>
                                                            <span>₹{gstTotals.totalTax}</span>
                                                        </div>
                                                        <div className="border-t pt-2 flex justify-between font-bold text-lg text-green-800">
                                                            <span>Final Amount:</span>
                                                            <span>₹{gstTotals.grandTotal}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Terms & Additional Information */}
                            <Card className="border-blue-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Terms & Additional Information
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        Specify payment terms, delivery conditions, and any additional notes
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="terms" className="flex items-center gap-2 text-base font-medium">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            Terms & Conditions
                                        </Label>
                                        <Textarea
                                            id="terms"
                                            placeholder={`Payment Terms: 50% advance, 50% on delivery\nDelivery: 15-20 business days from order confirmation\nWarranty: 1 year manufacturer warranty\nInstallation: Free installation within city limits`}
                                            rows={4}
                                            value={responseForm.terms}
                                            onChange={(e) => setResponseForm(prev => ({ ...prev, terms: e.target.value }))}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Include payment terms, delivery timeline, warranty, and other conditions
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="notes" className="flex items-center gap-2 text-base font-medium">
                                            <MessageSquare className="h-4 w-4 text-purple-600" />
                                            Additional Notes
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            placeholder={`Special discounts applied for bulk order\nCustom specifications can be accommodated\nTechnical support included for first year`}
                                            rows={3}
                                            value={responseForm.notes}
                                            onChange={(e) => setResponseForm(prev => ({ ...prev, notes: e.target.value }))}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Any special offers, custom modifications, or important information for the customer
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter className="flex gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsResponseDialogOpen(false)}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedQuotation && handleStatusUpdate(selectedQuotation._id, "quoted")}
                            disabled={isSubmitting || !responseForm.subtotal || !responseForm.validUntil}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending Quote...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Quotation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
