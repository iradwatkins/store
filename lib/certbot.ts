import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import { logger } from "@/lib/logger"

const execAsync = promisify(exec)

export interface CertbotResult {
  success: boolean
  message: string
  certificatePath?: string
  error?: string
  stdout?: string
  stderr?: string
}

export interface CertificateInfo {
  exists: boolean
  domain?: string
  expiryDate?: Date
  daysUntilExpiry?: number
  certificatePath?: string
  keyPath?: string
  chainPath?: string
  fullchainPath?: string
  isValid?: boolean
  error?: string
}

/**
 * Request a new SSL certificate from Let's Encrypt using Certbot
 * Uses standalone mode with HTTP-01 challenge
 */
export async function requestCertificate(
  domain: string,
  email: string = "ssl@stepperslife.com"
): Promise<CertbotResult> {
  try {
    logger.info(`🔐 Requesting SSL certificate for ${domain}...`)

    // Certbot command using standalone mode
    // Note: This requires port 80 to be available temporarily
    // In production, use nginx webroot plugin instead
    const command = [
      "sudo",
      "certbot",
      "certonly",
      "--nginx", // Use nginx plugin (better for our use case)
      "-d",
      domain,
      "--non-interactive",
      "--agree-tos",
      "--email",
      email,
      "--no-eff-email",
      "--redirect", // Auto-redirect HTTP to HTTPS
    ].join(" ")

    logger.info(`Executing: ${command}`)

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minute timeout
    })

    logger.info("Certbot stdout:", { data: stdout })
    if (stderr) logger.info("Certbot stderr:", { data: stderr })

    // Check if certificate was successfully created
    const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`

    try {
      await fs.access(certPath)

      return {
        success: true,
        message: `SSL certificate successfully issued for ${domain}`,
        certificatePath: certPath,
        stdout,
        stderr,
      }
    } catch {
      return {
        success: false,
        message: `Certificate request appeared to succeed but certificate file not found at ${certPath}`,
        error: "Certificate file not found",
        stdout,
        stderr,
      }
    }
  } catch (error: any) {
    logger.error(`Failed to request certificate for ${domain}:`, error ? error : undefined)

    return {
      success: false,
      message: `Failed to request SSL certificate: ${error.message}`,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}

/**
 * Get information about an existing certificate
 */
export async function getCertificateInfo(
  domain: string
): Promise<CertificateInfo> {
  try {
    const certDir = `/etc/letsencrypt/live/${domain}`
    const certPath = `${certDir}/cert.pem`
    const fullchainPath = `${certDir}/fullchain.pem`
    const keyPath = `${certDir}/privkey.pem`
    const chainPath = `${certDir}/chain.pem`

    // Check if certificate exists
    try {
      await fs.access(certPath)
    } catch {
      return {
        exists: false,
        error: "Certificate not found",
      }
    }

    // Get certificate expiry using openssl
    try {
      const { stdout } = await execAsync(
        `sudo openssl x509 -enddate -noout -in ${certPath}`
      )

      // Parse expiry date from output like "notAfter=Jan 10 12:34:56 2025 GMT"
      const expiryMatch = stdout.match(/notAfter=(.+)/)
      if (!expiryMatch) {
        return {
          exists: true,
          domain,
          certificatePath: certPath,
          keyPath,
          chainPath,
          fullchainPath,
          error: "Could not parse certificate expiry date",
        }
      }

      const expiryDate = new Date(expiryMatch[1])
      const now = new Date()
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        exists: true,
        domain,
        expiryDate,
        daysUntilExpiry,
        certificatePath: certPath,
        keyPath,
        chainPath,
        fullchainPath,
        isValid: daysUntilExpiry > 0,
      }
    } catch (error: any) {
      return {
        exists: true,
        domain,
        certificatePath: certPath,
        keyPath,
        chainPath,
        fullchainPath,
        error: `Failed to get certificate info: ${error.message}`,
      }
    }
  } catch (error: any) {
    return {
      exists: false,
      error: error.message,
    }
  }
}

/**
 * Renew an existing certificate
 */
export async function renewCertificate(domain: string): Promise<CertbotResult> {
  try {
    logger.info(`🔄 Renewing SSL certificate for ${domain}...`)

    const command = [
      "sudo",
      "certbot",
      "renew",
      "--cert-name",
      domain,
      "--non-interactive",
    ].join(" ")

    logger.info(`Executing: ${command}`)

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minute timeout
    })

    logger.info("Certbot renew stdout:", { data: stdout })
    if (stderr) logger.info("Certbot renew stderr:", { data: stderr })

    // Check if renewal was successful
    if (stdout.includes("Certificate not yet due for renewal")) {
      return {
        success: true,
        message: `Certificate for ${domain} is not yet due for renewal`,
        stdout,
        stderr,
      }
    }

    if (
      stdout.includes("Successfully renewed certificate") ||
      stdout.includes("Certificate is up to date")
    ) {
      return {
        success: true,
        message: `SSL certificate successfully renewed for ${domain}`,
        stdout,
        stderr,
      }
    }

    return {
      success: false,
      message: `Certificate renewal status unclear for ${domain}`,
      stdout,
      stderr,
    }
  } catch (error: any) {
    logger.error(`Failed to renew certificate for ${domain}:`, error ? error : undefined)

    return {
      success: false,
      message: `Failed to renew SSL certificate: ${error.message}`,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}

/**
 * Revoke and delete a certificate
 */
export async function revokeCertificate(
  domain: string
): Promise<CertbotResult> {
  try {
    logger.info(`🗑️ Revoking SSL certificate for ${domain}...`)

    const command = [
      "sudo",
      "certbot",
      "delete",
      "--cert-name",
      domain,
      "--non-interactive",
    ].join(" ")

    logger.info(`Executing: ${command}`)

    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 1 minute timeout
    })

    logger.info("Certbot delete stdout:", { data: stdout })
    if (stderr) logger.info("Certbot delete stderr:", { data: stderr })

    return {
      success: true,
      message: `SSL certificate successfully revoked for ${domain}`,
      stdout,
      stderr,
    }
  } catch (error: any) {
    logger.error(`Failed to revoke certificate for ${domain}:`, error ? error : undefined)

    return {
      success: false,
      message: `Failed to revoke SSL certificate: ${error.message}`,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}

/**
 * List all certificates managed by Certbot
 */
export async function listCertificates(): Promise<{
  success: boolean
  certificates: string[]
  error?: string
}> {
  try {
    const { stdout } = await execAsync("sudo certbot certificates", {
      timeout: 30000,
    })

    // Parse certificate names from output
    const certNameRegex = /Certificate Name: ([^\n]+)/g
    const certificates: string[] = []
    let match

    while ((match = certNameRegex.exec(stdout)) !== null) {
      certificates.push(match[1].trim())
    }

    return {
      success: true,
      certificates,
    }
  } catch (error: any) {
    return {
      success: false,
      certificates: [],
      error: error.message,
    }
  }
}

/**
 * Check if Certbot is installed and working
 */
export async function checkCertbotInstalled(): Promise<{
  installed: boolean
  version?: string
  error?: string
}> {
  try {
    const { stdout } = await execAsync("certbot --version", {
      timeout: 10000,
    })

    const versionMatch = stdout.match(/certbot (\d+\.\d+\.\d+)/)
    const version = versionMatch ? versionMatch[1] : stdout.trim()

    return {
      installed: true,
      version,
    }
  } catch (error: any) {
    return {
      installed: false,
      error: error.message,
    }
  }
}

/**
 * Reload Nginx to apply new certificates
 */
export async function reloadNginx(): Promise<CertbotResult> {
  try {
    logger.info("🔄 Reloading Nginx to apply SSL certificates...")

    // Test configuration first
    const testResult = await execAsync("sudo nginx -t", { timeout: 10000 })
    logger.info("Nginx test:", { data: testResult.stdout })

    // Reload Nginx
    const reloadResult = await execAsync("sudo systemctl reload nginx", {
      timeout: 10000,
    })
    logger.info("Nginx reload:", { data: reloadResult.stdout })

    return {
      success: true,
      message: "Nginx reloaded successfully",
      stdout: reloadResult.stdout,
    }
  } catch (error: any) {
    logger.error("Failed to reload Nginx:", error)

    return {
      success: false,
      message: `Failed to reload Nginx: ${error.message}`,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}
