"use client"

import { CoverValidationResult } from "@/lib/covers/kdp-validation"
import { formatValidationDetails } from "@/lib/covers/kdp-validation"

interface CoverValidationStatusProps {
  validationResult: CoverValidationResult | null
}

export function CoverValidationStatus({ validationResult }: CoverValidationStatusProps) {
  if (!validationResult) {
    return null
  }

  const { valid, errors, warnings } = validationResult

  if (valid && warnings.length === 0) {
    // Valid state - green checkmark
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-green-800">Cover meets KDP requirements</p>
          {validationResult.details && (
            <p className="text-sm text-green-600 mt-1">
              {formatValidationDetails(validationResult.details)}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (warnings.length > 0 && errors.length === 0) {
    // Warning state - yellow triangle
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.342-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-amber-800">Cover recommendations</p>
          <ul className="text-sm text-amber-700 mt-1 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          {validationResult.details && (
            <p className="text-sm text-amber-600 mt-2">
              {formatValidationDetails(validationResult.details)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Invalid state - red X
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-red-800">Cover does not meet KDP requirements</p>
        <ul className="text-sm text-red-700 mt-1 space-y-1">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        {validationResult.details && (
          <p className="text-sm text-red-600 mt-2">
            {formatValidationDetails(validationResult.details)}
          </p>
        )}
      </div>
    </div>
  )
}