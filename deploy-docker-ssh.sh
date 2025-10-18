#!/bin/bash

# Multi-Variant E-commerce System - Docker SSH Deployment Script
# =============================================================

set -e

echo "🚀 Multi-Variant E-commerce System - Docker SSH Deployment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER=${SERVER_USER:-root}
SERVER_HOST=${SERVER_HOST:-your-server-ip}
SERVER_PORT=${SERVER_PORT:-22}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/ecommerce}
PROJECT_NAME=${PROJECT_NAME:-multi-variant-ecommerce}

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required environment variables are set
check_config() {
    log_info "Checking deployment configuration..."
    
    if [ -z "$SERVER_HOST" ] || [ "$SERVER_HOST" = "your-server-ip" ]; then
        log_error "SERVER_HOST must be set to your VPS IP address"
        echo "Usage: SERVER_HOST=1.2.3.4 SERVER_USER=ubuntu ./deploy-docker-ssh.sh"
        exit 1
    fi
    
    if [ -z "$SERVER_USER" ]; then
        log_error "SERVER_USER must be set"
        exit 1
    fi
    
    log_success "Configuration validated"
}

# Test SSH connection
test_ssh() {
    log_info "Testing SSH connection to $SERVER_USER@$SERVER_HOST:$SERVER_PORT..."
    
    if ! ssh -p $SERVER_PORT -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH connection successful'" > /dev/null 2>&1; then
        log_error "SSH connection failed. Please check:"
        echo "  - Server IP: $SERVER_HOST"
        echo "  - User: $SERVER_USER"
        echo "  - Port: $SERVER_PORT"
        echo "  - SSH key authentication is set up"
        exit 1
    fi
    
    log_success "SSH connection successful"
}

# Install Docker on remote server if needed
install_docker() {
    log_info "Checking Docker installation on remote server..."
    
    DOCKER_INSTALLED=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "command -v docker >/dev/null 2>&1 && echo 'yes' || echo 'no'")
    
    if [ "$DOCKER_INSTALLED" = "no" ]; then
        log_warning "Docker not found. Installing Docker..."
        
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'EOF'
            # Update package index
            apt-get update
            
            # Install prerequisites
            apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Set up stable repository
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            
            # Add user to docker group
            usermod -aG docker $USER
            
            # Start and enable Docker
            systemctl start docker
            systemctl enable docker
EOF
        
        log_success "Docker installed successfully"
    else
        log_success "Docker is already installed"
    fi
}

# Create deployment directory on remote server
setup_remote_directory() {
    log_info "Setting up deployment directory on remote server..."
    
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        # Create deployment directory
        mkdir -p $DEPLOY_PATH
        cd $DEPLOY_PATH
        
        # Create subdirectories
        mkdir -p ssl nginx-logs backups
        
        # Set permissions
        chown -R $SERVER_USER:$SERVER_USER $DEPLOY_PATH
EOF
    
    log_success "Remote directory structure created"
}

# Transfer files to remote server
transfer_files() {
    log_info "Transferring application files to remote server..."
    
    # Create temporary deployment package
    TEMP_DIR=$(mktemp -d)
    PACKAGE_NAME="multi-variant-ecommerce-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Copy necessary files
    cp -r . "$TEMP_DIR/app/"
    cd "$TEMP_DIR"
    
    # Create deployment package
    tar -czf "$PACKAGE_NAME" \
        --exclude='app/node_modules' \
        --exclude='app/.next' \
        --exclude='app/.git' \
        --exclude='app/test-*' \
        --exclude='app/*.log' \
        app/
    
    # Transfer to server
    scp -P $SERVER_PORT "$PACKAGE_NAME" $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/
    
    # Extract on server
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $DEPLOY_PATH
        tar -xzf $PACKAGE_NAME
        mv app/* .
        rmdir app
        rm $PACKAGE_NAME
        
        # Set executable permissions
        chmod +x docker-entrypoint.sh
        chmod +x deploy-docker-ssh.sh
EOF
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    log_success "Files transferred successfully"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Check if .env.production exists locally
    if [ ! -f ".env.production" ]; then
        log_warning ".env.production not found. Creating template..."
        cat > .env.production << 'EOF'
# REQUIRED: Update these values for your production environment
POSTGRES_DB=ecommerce
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
DATABASE_URL=postgresql://ecommerce_user:CHANGE_THIS_PASSWORD@postgres:5432/ecommerce
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD
REDIS_URL=redis://:CHANGE_THIS_REDIS_PASSWORD@redis:6379
NEXTAUTH_SECRET=CHANGE_THIS_TO_32_CHARACTER_SECRET
NEXTAUTH_URL=https://yourdomain.com
SEED_DATABASE=true
EOF
        log_error "Please update .env.production with your actual values and run again"
        exit 1
    fi
    
    # Transfer environment file
    scp -P $SERVER_PORT .env.production $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/.env
    
    log_success "Environment variables configured"
}

# Deploy with Docker Compose
deploy_application() {
    log_info "Deploying application with Docker Compose..."
    
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $DEPLOY_PATH
        
        # Stop existing containers if running
        docker compose down || true
        
        # Remove old images (optional, keeps disk space clean)
        docker system prune -f || true
        
        # Build and start services
        docker compose up -d --build
        
        # Wait for services to be healthy
        echo "Waiting for services to be ready..."
        sleep 30
        
        # Check service status
        docker compose ps
EOF
    
    log_success "Application deployed successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if services are running
    SERVICES_STATUS=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "cd $DEPLOY_PATH && docker compose ps --format json")
    
    # Test health endpoint
    sleep 10
    HEALTH_CHECK=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" || echo "000")
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        log_success "Health check passed"
    else
        log_warning "Health check failed (HTTP $HEALTH_CHECK)"
    fi
    
    # Show logs
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $DEPLOY_PATH
        echo "📋 Service Status:"
        docker compose ps
        
        echo ""
        echo "📊 Recent Application Logs:"
        docker compose logs --tail=20 app
EOF
    
    log_success "Deployment verification complete"
}

# Backup current deployment
backup_deployment() {
    log_info "Creating backup of current deployment..."
    
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << EOF
        cd $DEPLOY_PATH
        
        # Create backup directory with timestamp
        BACKUP_DIR="backups/backup-\$(date +%Y%m%d-%H%M%S)"
        mkdir -p "\$BACKUP_DIR"
        
        # Backup database
        if docker compose ps postgres | grep -q "running"; then
            docker compose exec -T postgres pg_dump -U \${POSTGRES_USER:-ecommerce_user} \${POSTGRES_DB:-ecommerce} > "\$BACKUP_DIR/database.sql"
            echo "Database backed up to \$BACKUP_DIR/database.sql"
        fi
        
        # Backup environment and configs
        cp .env "\$BACKUP_DIR/" 2>/dev/null || true
        cp docker-compose.yml "\$BACKUP_DIR/" 2>/dev/null || true
        
        echo "Backup created in $DEPLOY_PATH/\$BACKUP_DIR"
EOF
    
    log_success "Backup created"
}

# Show deployment information
show_deployment_info() {
    echo ""
    echo "🎉 Multi-Variant E-commerce System Deployment Complete!"
    echo "======================================================"
    echo ""
    echo "🌐 Server Information:"
    echo "  Server: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
    echo "  Deploy Path: $DEPLOY_PATH"
    echo "  Application URL: http://$SERVER_HOST:3000"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs:    ssh $SERVER_USER@$SERVER_HOST 'cd $DEPLOY_PATH && docker compose logs -f'"
    echo "  Restart:      ssh $SERVER_USER@$SERVER_HOST 'cd $DEPLOY_PATH && docker compose restart'"
    echo "  Stop:         ssh $SERVER_USER@$SERVER_HOST 'cd $DEPLOY_PATH && docker compose down'"
    echo "  Update:       Re-run this deployment script"
    echo ""
    echo "📊 Multi-Variant Features Available:"
    echo "  ✅ Product Variant Wizard at /dashboard/products/new"
    echo "  ✅ Multi-Variant Selector on product pages"
    echo "  ✅ Inventory Management at /dashboard/products"
    echo "  ✅ Cart integration with variant combinations"
    echo "  ✅ Order processing with variant details"
    echo ""
    echo "🔒 Security Notes:"
    echo "  - Update default passwords in .env file"
    echo "  - Configure SSL certificates in nginx.conf"
    echo "  - Set up proper domain names"
    echo "  - Configure firewall rules"
    echo ""
}

# Main deployment flow
main() {
    echo "Starting deployment with the following configuration:"
    echo "  Server: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
    echo "  Deploy Path: $DEPLOY_PATH"
    echo ""
    
    check_config
    test_ssh
    install_docker
    setup_remote_directory
    transfer_files
    setup_environment
    backup_deployment
    deploy_application
    verify_deployment
    show_deployment_info
    
    log_success "🚀 Deployment completed successfully!"
}

# Run main function
main "$@"