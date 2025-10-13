import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-up">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-semibold md:text-5xl animate-fade-up animation-delay-100">
            Monetize and Access Data with Confidence
          </h1>
          <p className="text-muted-foreground leading-relaxed animate-fade-up animation-delay-150">
            Synapse Ledger is a frontend-only simulation that showcases a data marketplace: upload datasets, create
            pools, and purchase access with a mock wallet.
          </p>
          <div className="flex flex-wrap gap-3 animate-fade-up animation-delay-200">
            <Button asChild>
              <Link href="/upload">Upload Data</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        </div>

        <Card className="border-primary/30 animate-fade-up animation-delay-200">
          <CardContent className="p-0">
            <img src="/data-marketplace-dashboard-preview.jpg" alt="Data marketplace preview" className="h-full w-full rounded-md" />
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { title: "Upload", text: "Store a file to a mock IPFS and create a data pool." },
          { title: "Marketplace", text: "Discover and purchase access to datasets." },
          { title: "Dashboard", text: "Track your pools and purchases in one place." },
        ].map((f, i) => (
          <Card key={f.title} className="animate-fade-up" style={{ animationDelay: `${200 + i * 120}ms` }}>
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-medium">{f.title}</h3>
              <p className="text-muted-foreground">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
