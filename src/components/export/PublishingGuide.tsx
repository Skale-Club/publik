'use client'

import { CheckCircle, Circle, ExternalLink } from 'lucide-react'

/**
 * Publishing step data structure
 */
export interface PublishingStep {
  step: number
  title: string
  description: string
  details?: string[]
  important?: string
  link?: string
  note?: string
}

/**
 * KDP publishing steps data
 */
export const PUBLISHING_STEPS: PublishingStep[] = [
  {
    step: 1,
    title: "Sign in to KDP",
    description: "Go to kdp.amazon.com and sign in with your Amazon account. If you don't have an account, click 'Create a KDP account' and follow the prompts.",
    link: "https://kdp.amazon.com"
  },
  {
    step: 2,
    title: "Create New Title",
    description: "Click 'Create Kindle eBook' or 'Create Paperback' depending on your format. For printed books with your generated files, choose 'Paperback'.",
    details: [
      "Choose 'Paperback' for printed books",
      "Select 'Kindle eBook' for digital only",
      "You can also select both for expanded reach"
    ]
  },
  {
    step: 3,
    title: "Upload Your Files",
    description: "Upload the interior PDF and cover PDF from your ZIP package to the appropriate sections.",
    details: [
      "Interior PDF goes in 'Manuscript' or 'Interior' section",
      "Cover PDF goes in 'Cover' section",
      "KDP will validate your files automatically"
    ],
    important: "Make sure the file sizes are under 650MB. Large files may take time to upload."
  },
  {
    step: 4,
    title: "Fill in Book Details",
    description: "Enter your book title, description, author name, keywords, and select appropriate categories. This information helps readers find your book.",
    details: [
      "Title must match exactly on cover and interior",
      "Description should be compelling and accurate",
      "Use relevant keywords for discoverability"
    ],
    important: "Your book description is visible on the product page - make it engaging!"
  },
  {
    step: 5,
    title: "Set Pricing & Royalties",
    description: "Choose your book price and royalty options. KDP offers different royalty rates based on pricing and distribution.",
    details: [
      "70% royalty requires $2.99 minimum price and specific distribution",
      "35% royalty available for all price points",
      "Consider competitor pricing in your category"
    ],
    important: "Books under $2.99 are only eligible for 35% royalty in some markets."
  },
  {
    step: 6,
    title: "Review & Publish",
    description: "Review all your book details, preview how it will appear, and click 'Publish Your Book' when ready.",
    note: "KDP typically approves books within 24-72 hours. You'll receive an email when your book is live!"
  }
]

/**
 * Quick tips sidebar data
 */
export const QUICK_TIPS = [
  {
    title: "File Requirements",
    items: [
      "Format: PDF only",
      "Max size: 650MB",
      "Interior: Trim size matched to KDP spec",
      "Cover: Includes bleed and spine"
    ]
  },
  {
    title: "Common Mistakes to Avoid",
    items: [
      "Forgetting to include bleed on cover",
      "Text too close to trim edges",
      "Mismatched title on cover vs interior",
      "Not checking preview thoroughly"
    ]
  },
  {
    title: "Helpful Resources",
    items: [
      "KDP Help: kdp.amazon.com/en_US/help",
      "KDP Cover Guide: kdp.amazon.com/en_US/help/topic/G200672390",
      "KDP Pricing: kdp.amazon.com/en_US/help/topic/G200672390"
    ]
  }
]

interface PublishingGuideProps {
  showSidebar?: boolean
}

/**
 * Publishing Guide Component
 * Renders step-by-step KDP publishing instructions
 */
export function PublishingGuide({ showSidebar = true }: PublishingGuideProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      {/* Steps Timeline */}
      <div className="space-y-0">
        {PUBLISHING_STEPS.map((step, index) => (
          <div key={step.step} className="relative flex gap-4">
            {/* Timeline line */}
            {index < PUBLISHING_STEPS.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-[-1rem] w-0.5 bg-gray-200" />
            )}
            
            {/* Step number circle */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              {step.step}
            </div>
            
            {/* Step content */}
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              
              <p className="text-gray-600 mb-2">{step.description}</p>
              
              {step.details && step.details.length > 0 && (
                <ul className="list-disc list-inside text-gray-600 space-y-1 mb-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="text-sm">{detail}</li>
                  ))}
                </ul>
              )}
              
              {step.important && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-yellow-800 font-medium">
                    <span className="font-semibold">Important:</span> {step.important}
                  </p>
                </div>
              )}
              
              {step.note && (
                <p className="text-sm text-gray-500 italic mt-2">{step.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Sidebar with quick tips */}
      {showSidebar && (
        <div className="space-y-6">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Tips</h4>
            
            {QUICK_TIPS.map((section, idx) => (
              <div key={idx} className={idx > 0 ? 'mt-4 pt-4 border-t' : ''}>
                <h5 className="font-medium text-gray-800 text-sm mb-2">{section.title}</h5>
                <ul className="space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-xs text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Need More Help?</h4>
            <p className="text-sm text-blue-800 mb-3">
              Visit the KDP Help portal for detailed guides and troubleshooting.
            </p>
            <a
              href="https://kdp.amazon.com/en_US/help"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900"
            >
              Visit KDP Help <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
