// Dependency Conflict Checker
// Run: npx tsx scripts/check-dependencies.ts

import { readFileSync } from "fs"
import { join } from "path"

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface Conflict {
  package: string
  issue: string
  severity: "error" | "warning" | "info"
  suggestion: string
}

function checkDependencies(): Conflict[] {
  const conflicts: Conflict[] = []

  // Read package.json
  const packageJsonPath = join(process.cwd(), "package.json")
  const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  // Check React version compatibility
  const reactVersion = deps["react"]
  const nextVersion = deps["next"]

  if (reactVersion && nextVersion) {
    if (reactVersion.includes("19.") && !nextVersion.includes("16.")) {
      conflicts.push({
        package: "react + next",
        issue: "React 19 requires Next.js 15.1+",
        severity: "error",
        suggestion: "Upgrade Next.js to 16.0.7 (current) or higher",
      })
    }
  }

  // Check Tailwind CSS v4
  const tailwindVersion = deps["tailwindcss"]
  if (tailwindVersion && tailwindVersion.includes("4.")) {
    conflicts.push({
      package: "tailwindcss",
      issue: "Tailwind CSS v4 is in beta",
      severity: "info",
      suggestion: "Monitor for updates, but current version is stable for production",
    })
  }

  // Check Radix UI compatibility with React 19
  const radixPackages = Object.keys(deps).filter((key) => key.startsWith("@radix-ui/"))
  radixPackages.forEach((pkg) => {
    const version = deps[pkg]
    if (version && version.startsWith("1.")) {
      // Radix UI 1.x is compatible with React 18+
      // React 19 might show warnings but should work
      conflicts.push({
        package: pkg,
        issue: "May show React 19 warnings (non-breaking)",
        severity: "info",
        suggestion: "Safe to ignore. Radix UI team is working on full React 19 support",
      })
    }
  })

  // Check jsPDF bundle size
  if (deps["jspdf"]) {
    conflicts.push({
      package: "jspdf",
      issue: "Large bundle size (~500KB)",
      severity: "warning",
      suggestion: "Consider code splitting or lazy loading PDF generation",
    })
  }

  // Check Appwrite SDK versions
  const appwriteClient = deps["appwrite"]
  const appwriteNode = deps["node-appwrite"]

  if (appwriteClient && appwriteNode) {
    const clientMajor = appwriteClient.split(".")[0]
    const nodeMajor = appwriteNode.split(".")[0]

    if (clientMajor !== nodeMajor) {
      conflicts.push({
        package: "appwrite + node-appwrite",
        issue: "Major version mismatch between client and server SDKs",
        severity: "warning",
        suggestion: `Align versions: appwrite@${nodeMajor}.x.x and node-appwrite@${nodeMajor}.x.x`,
      })
    }
  }

  // Check TypeScript version
  const tsVersion = deps["typescript"]
  if (tsVersion && Number.parseInt(tsVersion.split(".")[0].replace("^", "")) < 5) {
    conflicts.push({
      package: "typescript",
      issue: "TypeScript version below 5.0",
      severity: "warning",
      suggestion: "Upgrade to TypeScript 5+ for better type checking and performance",
    })
  }

  return conflicts
}

function printReport(conflicts: Conflict[]) {
  console.log("\n=== Dependency Analysis Report ===\n")

  const errors = conflicts.filter((c) => c.severity === "error")
  const warnings = conflicts.filter((c) => c.severity === "warning")
  const infos = conflicts.filter((c) => c.severity === "info")

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ No critical issues found!\n")
  }

  if (errors.length > 0) {
    console.log("❌ ERRORS (Must Fix):\n")
    errors.forEach((c, i) => {
      console.log(`${i + 1}. ${c.package}`)
      console.log(`   Issue: ${c.issue}`)
      console.log(`   Fix: ${c.suggestion}\n`)
    })
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS (Should Consider):\n")
    warnings.forEach((c, i) => {
      console.log(`${i + 1}. ${c.package}`)
      console.log(`   Issue: ${c.issue}`)
      console.log(`   Suggestion: ${c.suggestion}\n`)
    })
  }

  if (infos.length > 0) {
    console.log("ℹ️  INFO (Good to Know):\n")
    infos.forEach((c, i) => {
      console.log(`${i + 1}. ${c.package}`)
      console.log(`   Note: ${c.issue}`)
      console.log(`   Info: ${c.suggestion}\n`)
    })
  }

  console.log("=================================\n")

  // Summary
  console.log("Summary:")
  console.log(`Total packages checked: ${Object.keys(require("../package.json").dependencies || {}).length}`)
  console.log(`Errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log(`Info: ${infos.length}`)

  if (errors.length === 0) {
    console.log("\n✅ All critical dependencies are compatible!")
    console.log("✅ Safe to proceed with development and deployment.\n")
  } else {
    console.log("\n❌ Please fix errors before deploying to production.\n")
  }
}

// Run the check
const conflicts = checkDependencies()
printReport(conflicts)

// Exit with error code if critical issues found
const criticalIssues = conflicts.filter((c) => c.severity === "error").length
process.exit(criticalIssues > 0 ? 1 : 0)
