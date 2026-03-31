'use client'

import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Image,
  Shield,
  ShieldAlert,
  ShieldX
} from 'lucide-react'
import type { ValidationResult } from '@/lib/export/validator'

interface ValidationReportProps {
  result: ValidationResult
  showDetails?: boolean
}

/**
 * Validation report component displays KDP compliance status
 */
export function ValidationReport({ result, showDetails = true }: ValidationReportProps) {
  const { valid, interior, cover } = result
  
  const getOverallStatus = () => {
    if (valid) {
      return {
        icon: <Shield className="w-6 h-6 text-green-600" />,
        text: 'Ready for KDP',
        description: 'All files meet Amazon KDP specifications',
        bgClass: 'bg-green-50 border-green-200',
        textClass: 'text-green-800'
      }
    }
    
    const hasErrors = 
      interior.issues.some(i => i.type === 'error') ||
      cover.issues.some(i => i.type === 'error')
    
    if (hasErrors) {
      return {
        icon: <ShieldX className="w-6 h-6 text-red-600" />,
        text: 'Issues Found',
        description: 'Some files do not meet KDP requirements',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-800'
      }
    }
    
    return {
      icon: <ShieldAlert className="w-6 h-6 text-yellow-600" />,
      text: 'Warnings Only',
      description: 'Files may need attention before uploading',
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-800'
    }
  }
  
  const status = getOverallStatus()
  
  const renderIssues = (issues: ValidationResult['interior']['issues'], title: string) => {
    if (issues.length === 0) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">No issues</span>
        </div>
      )
    }
    
    const errors = issues.filter(i => i.type === 'error')
    const warnings = issues.filter(i => i.type === 'warning')
    
    return (
      <div className="space-y-2">
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((issue, idx) => (
              <div key={`error-${idx}`} className="flex items-start gap-2 text-red-600">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">{issue.message}</p>
                  <span className="text-xs uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    {issue.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((issue, idx) => (
              <div key={`warning-${idx}`} className="flex items-start gap-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">{issue.message}</p>
                  <span className="text-xs uppercase bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                    {issue.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`border rounded-lg p-4 ${status.bgClass}`}>
      {/* Overall Status */}
      <div className="flex items-start gap-3 mb-4">
        {status.icon}
        <div>
          <h3 className={`font-semibold ${status.textClass}`}>{status.text}</h3>
          <p className="text-sm text-gray-600">{status.description}</p>
        </div>
      </div>
      
      {showDetails && (
        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-gray-200">
          {/* Interior PDF Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">Interior PDF</h4>
              {interior.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            {renderIssues(interior.issues, 'Interior')}
            
            {interior.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {interior.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-yellow-600">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cover PDF Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">Cover PDF</h4>
              {cover.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            {renderIssues(cover.issues, 'Cover')}
            
            {cover.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {cover.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-yellow-600">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
