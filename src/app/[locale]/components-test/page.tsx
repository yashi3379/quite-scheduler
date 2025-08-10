'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'

export default function ComponentsTestPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLoadingTest = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">UI Components Test</h1>
        
        {/* Button Components */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                <Button size="sm">Small Button</Button>
                <Button size="md">Medium Button</Button>
                <Button size="lg">Large Button</Button>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                <Button loading={loading} onClick={handleLoadingTest}>
                  {loading ? 'Loading...' : 'Test Loading'}
                </Button>
                <Button disabled>Disabled Button</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-md">
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="Enter your email"
              />
              
              <Input 
                label="Password" 
                type="password" 
                placeholder="Enter your password"
                error="Password must be at least 8 characters"
              />
              
              <Textarea 
                label="Message" 
                placeholder="Enter your message"
                rows={4}
              />
              
              <Textarea 
                label="Description" 
                placeholder="Enter description"
                error="This field is required"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Badge Components */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Badge Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Spinner Components */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Spinner Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Spinner size="sm" />
                <p className="mt-2 text-sm text-gray-600">Small</p>
              </div>
              <div className="text-center">
                <Spinner size="md" />
                <p className="mt-2 text-sm text-gray-600">Medium</p>
              </div>
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Large</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Component */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Modal Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
          </CardContent>
        </Card>

        {/* Card Variations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Example 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This is a basic card with header and content.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Card without Header</h3>
              <p className="text-gray-600">This card only has content without a header.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
            <CardHeader>
              <CardTitle>Custom Styled Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This card has custom styling applied.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Modal</h2>
          <p className="text-gray-600 mb-6">
            This is a test modal. You can close it by clicking the background, 
            pressing the Escape key, or clicking the close button.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}