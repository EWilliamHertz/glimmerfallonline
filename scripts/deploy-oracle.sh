#!/usr/bin/env bash
set -e

echo "=========================================="
echo "⚔️ GLIMMERFALL ONLINE — ORACLE CLOUD DEPLOYER"
echo "=========================================="

# 1. Update and install prerequisites
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git iptables-persistent

# 1b. Ensure swapfile exists (crucial for 1GB RAM AMD Micro instances)
if [ ! -f /swapfile ] && [ $(free -m | awk '/^Mem:/{print $2}') -lt 3000 ]; then
  echo "💾 Configuring 2GB swap space for smooth build on low-RAM instance..."
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 2. Open firewall ports (80, 443, 8080) in OS iptables
echo "🛡️ Opening firewall ports (80, 443, 8080)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT || true
sudo netfilter-persistent save || true

# 3. Install Node.js 20 LTS if not present
if ! command -v node &> /dev/null; then
  echo "⚡ Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "✓ Node version: $(node -v)"
echo "✓ NPM version: $(npm -v)"

# 4. Install PM2 process manager
if ! command -v pm2 &> /dev/null; then
  echo "🚀 Installing PM2 process manager..."
  sudo npm install -g pm2
fi

# 5. Clone or pull repo
INSTALL_DIR="$HOME/glimmerfallonline"
if [ ! -d "$INSTALL_DIR" ]; then
  echo "📥 Cloning GlimmerFall Online repository..."
  git clone https://github.com/EWilliamHertz/glimmerfallonline.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
else
  echo "🔄 Updating existing GlimmerFall Online repository..."
  cd "$INSTALL_DIR"
  git pull origin main
fi

# 6. Install dependencies and build client bundle
echo "🔨 Building client application..."
npm install
npm run build

# 7. Start or restart PM2 process
echo "🎮 Starting GlimmerFall MMO Server on port 8080..."
PORT=8080 pm2 start server/index.js --name "glimmerfall" --update-env || pm2 restart glimmerfall --update-env
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

PUBLIC_IP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "YOUR_SERVER_IP")

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "⚔️ Play GlimmerFall Online at:"
echo "👉 http://${PUBLIC_IP}:8080"
echo "=========================================="
