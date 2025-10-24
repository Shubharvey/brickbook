'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Search, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Due {
  id: string
  invoiceNo: string
  customer: {
    name: string
    phone?: string
  }
  totalAmount: number
  paidAmount: number
  dueAmount: number
  status: 'pending' | 'partial' | 'paid'
  createdAt: string
  daysOverdue: number
}

export default function DuesManagement() {
  const { token } = useAuth()
  const [dues, setDues] = useState<Due[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial'>('all')

  useEffect(() => {
    if (token) {
      fetchDues()
    }
  }, [token])

  const fetchDues = async () => {
    try {
      const response = await fetch('/api/dues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDues(data)
      }
    } catch (error) {
      console.error('Failed to fetch dues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDues = dues.filter(due => {
    const matchesSearch = due.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         due.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || due.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const calculateDaysOverdue = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOverdueColor = (days: number) => {
    if (days > 30) return 'text-red-600 font-semibold'
    if (days > 7) return 'text-orange-600'
    return 'text-gray-600'
  }

  const totalDues = filteredDues.reduce((sum, due) => sum + due.dueAmount, 0)
  const overdueCount = filteredDues.filter(due => calculateDaysOverdue(due.createdAt) > 7).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dues Management</h1>
          <p className="text-gray-600">Track and manage pending payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total Dues</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalDues.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Overdue (>7 days)</p>
                <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Customers with Dues</p>
                <p className="text-2xl font-bold text-gray-900">{filteredDues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer name or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All ({dues.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({dues.filter(d => d.status === 'pending').length})
          </Button>
          <Button
            variant={filterStatus === 'partial' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('partial')}
          >
            Partial ({dues.filter(d => d.status === 'partial').length})
          </Button>
        </div>
      </div>

      {/* Dues List */}
      <div className="space-y-4">
        {filteredDues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No dues found' : 'No pending dues'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try a different search term' : 'All payments have been cleared!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDues.map((due) => {
            const daysOverdue = calculateDaysOverdue(due.createdAt)
            return (
              <Card key={due.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {due.customer.name}
                        </h3>
                        <Badge className={getStatusColor(due.status)}>
                          {due.status}
                        </Badge>
                        {daysOverdue > 7 && (
                          <Badge variant="destructive">
                            {daysOverdue} days overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Invoice: {due.invoiceNo}
                          </div>
                          {due.customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {due.customer.phone}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-sm text-gray-600">
                            Total: ₹{due.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Paid: ₹{due.paidAmount.toFixed(2)}
                          </div>
                          <div className={`text-lg font-bold ${getOverdueColor(daysOverdue)}`}>
                            Due: ₹{due.dueAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Created {new Date(due.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Reminder
                          </Button>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}