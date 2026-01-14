import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Simple, Transparent Pricing
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Professional Medical Surveillance
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Complete system for occupational health clinics. Pay per branch with no hidden fees.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 border-2 border-primary/20 shadow-xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Monthly Subscription */}
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Monthly Subscription</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">R6,500</span>
                    <span className="text-muted-foreground">/branch/month</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">Everything you need to run your clinic:</p>
                  {[
                    "Unlimited patients",
                    "Unlimited staff users",
                    "All clinical tests (Audiometry, Spirometry, Vision, X-Ray)",
                    "Automated certificate generation",
                    "Employer portal access",
                    "Advanced reporting & analytics",
                    "Secure data storage",
                    "24/7 support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setup Fee */}
              <div className="border-l pl-12 hidden md:block">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">One-time Setup Fee</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">R8,500</span>
                    <span className="text-muted-foreground">/branch</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">White-glove onboarding includes:</p>
                  {[
                    "Staff training & onboarding",
                    "Custom clinic branding",
                    "Workflow customization",
                    "Medical forms configuration",
                    "Employer dashboard setup",
                    "Data migration assistance",
                    "Custom report templates",
                    "Dedicated setup support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Setup Fee */}
              <div className="md:hidden pt-8 border-t">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">One-time Setup Fee</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">R8,500</span>
                    <span className="text-muted-foreground">/branch</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">White-glove onboarding includes:</p>
                  {[
                    "Staff training & onboarding",
                    "Custom clinic branding",
                    "Workflow customization",
                    "Medical forms configuration",
                    "Employer dashboard setup",
                    "Data migration assistance",
                    "Custom report templates",
                    "Dedicated setup support",
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Example: 2 branches</p>
                  <p className="text-2xl font-bold">R13,000/month + R17,000 setup</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="lg" asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need for Medical Surveillance</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Multi-Tenant Security",
                description:
                  "Complete data isolation between clinics with row-level security. POPIA compliant with audit logging.",
              },
              {
                title: "Clinical Workflow",
                description:
                  "Streamlined patient journey from reception to certificate issuance with automated status tracking.",
              },
              {
                title: "Employer Portal",
                description:
                  "Give employers secure access to view their workers health status and download certificates.",
              },
              {
                title: "Advanced Reporting",
                description: "Comprehensive analytics and custom reports for compliance and business insights.",
              },
              {
                title: "Mobile Optimized",
                description: "Full functionality on any device. Use tablets in examination rooms or phones on the go.",
              },
              {
                title: "Scalable & Reliable",
                description: "Built on enterprise-grade infrastructure. Handle thousands of patients with ease.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-6">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: "How does billing work?",
                a: "You pay R6,500 per branch per month via Paystack subscription. The one-time setup fee of R8,500 per branch is charged once during onboarding.",
              },
              {
                q: "Can I add or remove branches?",
                a: "Yes! You can add new branches anytime. Each new branch requires the setup fee and adds R6,500 to your monthly subscription.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes, we offer a 14-day free trial for new clinics. No credit card required to start.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and EFT through Paystack. All payments are secure and encrypted.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription anytime. Your data will be available for download for 30 days after cancellation.",
              },
            ].map((faq) => (
              <Card key={faq.q} className="p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
