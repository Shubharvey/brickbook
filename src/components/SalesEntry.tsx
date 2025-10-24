'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2,
  IndianRupee,
  Package,
  Calendar,
  User,
  Receipt,
  AlertCircle
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
}

interface SaleItem {
  id: string
  name: string
  quantity: number
  rate: number
  amount: number
}

interface Sale {
  id: string
  invoiceNo: string
  customer: Customer
  items: any[]
  totalAmount: number
  paidAmount: number
  dueAmount: number
  paymentType: string
  status: string
  notes?: string
  createdAt: string
}

export default function SalesEntry() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SaleItem[]>([
    { id: '1', name: '', quantity: 1, rate: 0, amount: 0 }
  ])

  useEffect(() => {
    fetchCustomers()
    fetchSales()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof SaleItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate
        }
        return updatedItem
      }
      return item
    }))
  }

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }

    const totalAmount = getTotalAmount()
    const paid = parseFloat(paidAmount) || (paymentType === 'cash' ? totalAmount : 0)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          items,
          totalAmount,
          paidAmount: paid,
          paymentType,
          notes
        }),
      })

      if (response.ok) {
        await fetchSales()
        setIsSaleDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create sale:', error)
    }
  }

  const resetForm = () => {
    setSelectedCustomer('')
    setPaymentType('cash')
    setPaidAmount('')
    setNotes('')
    setItems([{ id: '1', name: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading sales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Entry</h2>
          <p className="text-gray-600">Manage your sales transactions</p>
        </div>
        
        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Add a new sales transaction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Items</Label>
                <div className="space-y-2 mt-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      <div className="w-24 text-right font-medium">
                        ₹{item.amount.toFixed(2)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addItem} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paidAmount">
                    Paid Amount {paymentType === 'cash' && '(Auto-filled)'}
                  </Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    disabled={paymentType === 'cash'}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹{getTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Sale
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-xl font-bold">
                  ₹{sales
                    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + s.paidAmount, 0)
                    .toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Dues</p>
                <p className="text-xl font-bold">
                  ₹{sales.reduce((sum, s) => sum + s.dueAmount, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Cash Sales</p>
                <p className="text-xl font-bold">
                  {sales.filter(s => s.paymentType === 'cash').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first sale</p>
              <Button onClick={() => setIsSaleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sale
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{sale.invoiceNo}</h3>
                        {getStatusBadge(sale.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {sale.customer.name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {sale.items?.length || 0} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{sale.totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Paid: ₹{sale.paidAmount.toFixed(2)}
                      </p>
                      {sale.dueAmount > 0 && (
                        <p className="text-sm text-red-600">
                          Due: ₹{sale.dueAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {sale.items && sale.items.length > 0 && (
                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <div className="text-xs text-gray-600 mb-1">Items:</div>
                      <div className="space-y-1">
                        {sale.items.map((item: any, index: number) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₹{item.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {sale.notes && (
                    <div className="text-sm text-gray-600 italic">
                      Note: {sale.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}