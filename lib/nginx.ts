import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

export interface NginxConfig {
  domain: string
  tenantSlug: string
  sslCertificatePath?: string
  sslCertificateKeyPath?: string
  upstreamPort: number
}

export interface NginxResult {
  success: boolean
  message: string
  configPath?: string
  error?: string
  stdout?: string
  stderr?: string
}

/**
 * Generate Nginx configuration for a custom domain
 */
export function generateNginxConfig(config: NginxConfig): string {
  const {
    domain,
    tenantSlug,
    sslCertificatePath,
    sslCertificateKeyPath,
    upstreamPort,
  } = config

  const hasSSL = !!(sslCertificatePath && sslCertificateKeyPath)

  return `# Nginx configuration for ${tenantSlug} - Custom Domain
# Domain: ${domain}
# Tenant: ${tenantSlug}
# Generated: ${new Date().toISOString()}

upstream ${tenantSlug.replace(/-/g, "_")}_custom {
    server 127.0.0.1:${upstreamPort};
    keepalive 64;
}

# HTTP server
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    # Let's Encrypt ACME challenge
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

${
  hasSSL
    ? `    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }`
    : `    # Proxy to application (no SSL yet)
    location / {
        proxy_pass http://${tenantSlug.replace(/-/g, "_")}_custom;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }`
}
}

${
  hasSSL
    ? `# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL certificates (Let's Encrypt)
    ssl_certificate ${sslCertificatePath};
    ssl_certificate_key ${sslCertificateKeyPath};

    # SSL configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client upload size
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript image/svg+xml;

    # Proxy settings
    location / {
        proxy_pass http://${tenantSlug.replace(/-/g, "_")}_custom;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location /_next/static {
        proxy_pass http://${tenantSlug.replace(/-/g, "_")}_custom;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public {
        proxy_pass http://${tenantSlug.replace(/-/g, "_")}_custom;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Health check
    location /api/health {
        proxy_pass http://${tenantSlug.replace(/-/g, "_")}_custom;
        access_log off;
    }
}`
    : ""
}
`
}

/**
 * Write Nginx configuration file
 */
export async function writeNginxConfig(
  domain: string,
  configContent: string
): Promise<NginxResult> {
  try {
    const configFileName = `${domain}.conf`
    const sitesAvailablePath = `/etc/nginx/sites-available/${configFileName}`
    const sitesEnabledPath = `/etc/nginx/sites-enabled/${configFileName}`

    // Write config to temporary file first
    const tempPath = `/tmp/nginx-${domain}-${Date.now()}.conf`
    await fs.writeFile(tempPath, configContent, "utf-8")

    console.log(`📝 Writing Nginx config for ${domain}...`)

    // Move to sites-available with sudo
    await execAsync(`sudo mv ${tempPath} ${sitesAvailablePath}`, {
      timeout: 10000,
    })

    // Set proper permissions
    await execAsync(`sudo chmod 644 ${sitesAvailablePath}`, { timeout: 5000 })

    // Create symlink in sites-enabled if it doesn't exist
    try {
      await fs.access(sitesEnabledPath)
      console.log(`Symlink already exists: ${sitesEnabledPath}`)
    } catch {
      await execAsync(
        `sudo ln -s ${sitesAvailablePath} ${sitesEnabledPath}`,
        { timeout: 5000 }
      )
      console.log(`Created symlink: ${sitesEnabledPath}`)
    }

    // Test Nginx configuration
    try {
      const { stdout } = await execAsync("sudo nginx -t", { timeout: 10000 })
      console.log("Nginx test passed:", stdout)
    } catch (error: any) {
      // Rollback on test failure
      await execAsync(`sudo rm -f ${sitesAvailablePath} ${sitesEnabledPath}`, {
        timeout: 5000,
      })

      return {
        success: false,
        message: "Nginx configuration test failed",
        error: error.message,
        stderr: error.stderr,
      }
    }

    return {
      success: true,
      message: `Nginx configuration created for ${domain}`,
      configPath: sitesAvailablePath,
    }
  } catch (error: any) {
    console.error(`Failed to write Nginx config for ${domain}:`, error)

    return {
      success: false,
      message: `Failed to write Nginx configuration: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Remove Nginx configuration for a domain
 */
export async function removeNginxConfig(domain: string): Promise<NginxResult> {
  try {
    const configFileName = `${domain}.conf`
    const sitesAvailablePath = `/etc/nginx/sites-available/${configFileName}`
    const sitesEnabledPath = `/etc/nginx/sites-enabled/${configFileName}`

    console.log(`🗑️ Removing Nginx config for ${domain}...`)

    // Remove symlink from sites-enabled
    try {
      await execAsync(`sudo rm -f ${sitesEnabledPath}`, { timeout: 5000 })
      console.log(`Removed symlink: ${sitesEnabledPath}`)
    } catch (error) {
      console.log("Symlink doesn't exist or already removed")
    }

    // Remove config from sites-available
    try {
      await execAsync(`sudo rm -f ${sitesAvailablePath}`, { timeout: 5000 })
      console.log(`Removed config: ${sitesAvailablePath}`)
    } catch (error) {
      console.log("Config doesn't exist or already removed")
    }

    // Test Nginx configuration
    const { stdout } = await execAsync("sudo nginx -t", { timeout: 10000 })
    console.log("Nginx test passed:", stdout)

    return {
      success: true,
      message: `Nginx configuration removed for ${domain}`,
    }
  } catch (error: any) {
    console.error(`Failed to remove Nginx config for ${domain}:`, error)

    return {
      success: false,
      message: `Failed to remove Nginx configuration: ${error.message}`,
      error: error.message,
    }
  }
}

/**
 * Reload Nginx to apply configuration changes
 */
export async function reloadNginx(): Promise<NginxResult> {
  try {
    console.log("🔄 Reloading Nginx...")

    // Test configuration first
    const testResult = await execAsync("sudo nginx -t", { timeout: 10000 })
    console.log("Nginx test:", testResult.stdout)

    // Reload Nginx
    const reloadResult = await execAsync("sudo systemctl reload nginx", {
      timeout: 10000,
    })
    console.log("Nginx reload:", reloadResult.stdout)

    return {
      success: true,
      message: "Nginx reloaded successfully",
      stdout: reloadResult.stdout,
    }
  } catch (error: any) {
    console.error("Failed to reload Nginx:", error)

    return {
      success: false,
      message: `Failed to reload Nginx: ${error.message}`,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}

/**
 * Test Nginx configuration without reloading
 */
export async function testNginxConfig(): Promise<NginxResult> {
  try {
    const { stdout, stderr } = await execAsync("sudo nginx -t", {
      timeout: 10000,
    })

    return {
      success: true,
      message: "Nginx configuration is valid",
      stdout,
      stderr,
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Nginx configuration has errors",
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }
  }
}

/**
 * Check if Nginx config exists for a domain
 */
export async function nginxConfigExists(domain: string): Promise<boolean> {
  try {
    const configFileName = `${domain}.conf`
    const sitesAvailablePath = `/etc/nginx/sites-available/${configFileName}`

    await fs.access(sitesAvailablePath)
    return true
  } catch {
    return false
  }
}

/**
 * Update existing Nginx config with SSL certificates
 */
export async function updateNginxConfigWithSSL(
  domain: string,
  tenantSlug: string,
  certPath: string,
  keyPath: string,
  upstreamPort: number = 3008
): Promise<NginxResult> {
  try {
    console.log(`🔐 Updating Nginx config with SSL for ${domain}...`)

    // Generate new config with SSL
    const newConfig = generateNginxConfig({
      domain,
      tenantSlug,
      sslCertificatePath: certPath,
      sslCertificateKeyPath: keyPath,
      upstreamPort,
    })

    // Write new config
    const writeResult = await writeNginxConfig(domain, newConfig)

    if (!writeResult.success) {
      return writeResult
    }

    // Reload Nginx
    const reloadResult = await reloadNginx()

    if (!reloadResult.success) {
      return {
        success: false,
        message: "Config written but Nginx reload failed",
        error: reloadResult.error,
      }
    }

    return {
      success: true,
      message: `Nginx configuration updated with SSL for ${domain}`,
      configPath: writeResult.configPath,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update Nginx config with SSL: ${error.message}`,
      error: error.message,
    }
  }
}
