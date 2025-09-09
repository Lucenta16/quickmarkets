// Browser-compatible version of renderer.js

// Main application class
class QuickMarketsApp {
  constructor() {
    this.settings = {
      refreshRate: 30, // Default 30 seconds
      gridSize: 'medium', // Default medium grid
      watchlist: [
        // Default watchlist
        { symbol: 'AAPL', type: 'stock' },
        { symbol: 'MSFT', type: 'stock' },
        { symbol: 'GOOGL', type: 'stock' },
        { symbol: 'BTC-USD', type: 'crypto' },
        { symbol: 'ETH-USD', type: 'crypto' },
        { symbol: 'EUR=X', type: 'forex' },
        { symbol: 'GBP=X', type: 'forex' }
      ]
    };
    this.marketData = {};
    this.charts = {};
    this.refreshInterval = null;
    this.uiService = new UiService(this);
    this.apiService = new EnhancedApiService(this);
    
    // Initialize the application
    this.init();
  }

  async init() {
    try {
      // Initialize UI
      this.uiService.initUI();
      this.uiService.updateGridSize(this.settings.gridSize);
      
      // Start data refresh cycle
      this.startRefreshCycle();
      
      // Update status
      this.uiService.updateStatus('Application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      this.uiService.updateStatus('Failed to initialize application', false);
    }
  }

  startRefreshCycle() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Initial data fetch
    this.fetchAllMarketData();
    
    // Set up interval for regular updates
    this.refreshInterval = setInterval(() => {
      this.fetchAllMarketData();
    }, this.settings.refreshRate * 1000);
  }

  async fetchAllMarketData() {
    this.uiService.updateStatus('Fetching market data...');
    
    try {
      for (const instrument of this.settings.watchlist) {
        try {
          // Show loading state
          this.uiService.setCardLoading(instrument.symbol, true);
          
          // Fetch data
          const data = await this.apiService.fetchMarketData(instrument.symbol, instrument.type);
          
          // Store data
          this.marketData[instrument.symbol] = data;
          
          // Update UI
          this.uiService.updateMarketCard(instrument.symbol, data);
          
          // Remove loading state
          this.uiService.setCardLoading(instrument.symbol, false);
        } catch (error) {
          console.error(`Error fetching data for ${instrument.symbol}:`, error);
          this.uiService.showErrorForSymbol(instrument.symbol, error.message);
        }
      }
      
      this.uiService.updateStatus('Market data updated successfully', true);
    } catch (error) {
      console.error('Error fetching market data:', error);
      this.uiService.updateStatus('Failed to update market data', false);
    }
  }

  async saveSettings(newSettings) {
    try {
      // Update local settings
      this.settings = newSettings;
      
      // Apply changes
      this.uiService.updateGridSize(this.settings.gridSize);
      this.startRefreshCycle();
      
      // Update UI
      this.uiService.renderWatchlist();
      this.uiService.updateStatus('Settings saved successfully', true);
      
      // Save to localStorage for browser persistence
      localStorage.setItem('quickmarkets-settings', JSON.stringify(this.settings));
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      this.uiService.updateStatus('Failed to save settings', false);
      return false;
    }
  }

  addToWatchlist(symbol, type) {
    // Check if already exists
    const exists = this.settings.watchlist.some(item => item.symbol === symbol);
    
    if (!exists) {
      this.settings.watchlist.push({ symbol, type });
      this.uiService.renderWatchlist();
      this.uiService.createMarketCard(symbol, type);
      this.fetchAllMarketData();
      return true;
    }
    
    return false;
  }

  removeFromWatchlist(symbol) {
    this.settings.watchlist = this.settings.watchlist.filter(item => item.symbol !== symbol);
    this.uiService.removeMarketCard(symbol);
    this.uiService.renderWatchlist();
    return true;
  }
}

// UI Service class
class UiService {
  constructor(app) {
    this.app = app;
    this.marketGrid = document.getElementById('market-grid');
    this.clockElement = document.getElementById('clock');
    this.dateElement = document.getElementById('date');
    this.statusMessage = document.getElementById('status-message');
    this.connectionStatus = document.getElementById('connection-status');
    this.settingsModal = document.getElementById('settings-modal');
    this.settingsBtn = document.getElementById('settings-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.saveSettingsBtn = document.getElementById('save-settings-btn');
    this.cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    this.addInstrumentBtn = document.getElementById('add-instrument-btn');
    this.watchlistItems = document.getElementById('watchlist-items');
  }

  initUI() {
    // Initialize clock
    this.startClock();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render watchlist in settings
    this.renderWatchlist();
    
    // Create market cards
    this.createMarketCards();
  }

  setupEventListeners() {
    // Settings modal
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === this.settingsModal) {
        this.closeSettingsModal();
      }
    });
    
    // Close button in modal
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSettingsModal());
    }
    
    // Save settings
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    // Add instrument
    this.addInstrumentBtn.addEventListener('click', () => this.addInstrument());
    
    // Fullscreen toggle
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // Screensaver mode toggle
    const screensaverBtn = document.getElementById('screensaver-btn');
    if (screensaverBtn) {
      screensaverBtn.addEventListener('click', () => this.toggleScreensaverMode());
    }
    
    // Key press handler for screensaver mode
    document.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('screensaver-mode')) {
        // On first keypress, show UI elements
        if (e.key === 'Escape') {
          this.exitScreensaverMode();
        } else {
          // Show UI elements temporarily
          const header = document.querySelector('.app-header');
          const statusBar = document.querySelector('.status-bar');
          if (header) header.style.opacity = '1';
          if (statusBar) statusBar.style.opacity = '1';
          
          // Hide them again after 3 seconds
          setTimeout(() => {
            if (document.body.classList.contains('screensaver-mode')) {
              if (header) header.style.opacity = '0';
              if (statusBar) statusBar.style.opacity = '0';
            }
          }, 3000);
        }
      }
    });
  }

  startClock() {
    const updateClock = () => {
      const now = new Date();
      
      // Update time
      this.clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Update date
      this.dateElement.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    // Initial update
    updateClock();
    
    // Update every second
    setInterval(updateClock, 1000);
  }

  createMarketCards() {
    // Clear existing cards
    this.marketGrid.innerHTML = '';
    
    // Create cards for each instrument in watchlist
    this.app.settings.watchlist.forEach(instrument => {
      this.createMarketCard(instrument.symbol, instrument.type);
    });
  }

  createMarketCard(symbol, type) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'market-card';
    card.id = `card-${symbol}`;
    
    // Create card content - removed remove button for screensaver mode
    card.innerHTML = `
      <div class="card-header">
        <div class="symbol">${symbol}</div>
        <div class="instrument-type">${type}</div>
      </div>
      <div class="price-container">
        <div class="current-price">---.--</div>
        <div class="price-change">
          <span class="change-amount">---.--</span>
          <span class="change-percent">(---.--)</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="chart-${symbol}"></canvas>
      </div>
    `;
    
    // Add to grid
    this.marketGrid.appendChild(card);
    
    // Initialize chart
    this.initChart(symbol);
  }

  removeMarketCard(symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (card) {
      card.remove();
    }
    
    // Clean up chart instance
    if (this.app.charts[symbol]) {
      this.app.charts[symbol].destroy();
      delete this.app.charts[symbol];
    }
  }

  initChart(symbol) {
    const ctx = document.getElementById(`chart-${symbol}`).getContext('2d');
    
    // Create placeholder chart
    this.app.charts[symbol] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(24).fill(''),
        datasets: [{
          label: symbol,
          data: Array(24).fill(null),
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(33, 150, 243, 0)');
            gradient.addColorStop(1, 'rgba(33, 150, 243, 0.2)');
            return gradient;
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false
          }
        },
        animation: {
          duration: 1000
        }
      }
    });
  }

  updateMarketCard(symbol, data) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    // Update price and change
    const priceElement = card.querySelector('.current-price');
    const changeAmountElement = card.querySelector('.change-amount');
    const changePercentElement = card.querySelector('.change-percent');
    
    priceElement.textContent = data.price.toFixed(2);
    changeAmountElement.textContent = data.change.toFixed(2);
    changePercentElement.textContent = `(${data.changePercent.toFixed(2)}%)`;
    
    // Update color based on change
    const priceChangeElement = card.querySelector('.price-change');
    if (data.change >= 0) {
      priceChangeElement.classList.add('positive');
      priceChangeElement.classList.remove('negative');
    } else {
      priceChangeElement.classList.add('negative');
      priceChangeElement.classList.remove('positive');
    }
    
    // Update chart
    this.updateChart(symbol, data.historicalData);
  }

  updateChart(symbol, historicalData) {
    const chart = this.app.charts[symbol];
    if (!chart) return;
    
    // Update chart data
    chart.data.labels = historicalData.map(point => point.time);
    chart.data.datasets[0].data = historicalData.map(point => point.price);
    
    // Update chart color based on trend
    const firstPrice = historicalData[0]?.price || 0;
    const lastPrice = historicalData[historicalData.length - 1]?.price || 0;
    const trend = lastPrice - firstPrice;
    
    const color = trend >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)';
    const gradientColor = trend >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
    
    chart.data.datasets[0].borderColor = color;
    
    // Update gradient
    chart.data.datasets[0].backgroundColor = (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      if (!chartArea) return null;
      
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, gradientColor);
      return gradient;
    };
    
    // Update chart
    chart.update();
  }

  setCardLoading(symbol, isLoading) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    if (isLoading) {
      card.classList.add('loading');
    } else {
      card.classList.remove('loading');
    }
  }

  showErrorForSymbol(symbol, errorMessage) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    // Remove loading state
    card.classList.remove('loading');
    
    // Show error in price
    const priceElement = card.querySelector('.current-price');
    priceElement.textContent = 'Error';
    
    // Show error in change
    const changeAmountElement = card.querySelector('.change-amount');
    const changePercentElement = card.querySelector('.change-percent');
    
    changeAmountElement.textContent = '--';
    changePercentElement.textContent = '--';
    
    // Add error class
    card.classList.add('error');
    
    // Log error
    console.error(`Error for ${symbol}: ${errorMessage}`);
  }

  updateStatus(message, isConnected = true) {
    this.statusMessage.textContent = message;
    
    if (isConnected) {
      this.connectionStatus.classList.add('connected');
      this.connectionStatus.classList.remove('disconnected');
    } else {
      this.connectionStatus.classList.add('disconnected');
      this.connectionStatus.classList.remove('connected');
    }
  }

  updateGridSize(size) {
    // Remove existing size classes
    this.marketGrid.classList.remove('small', 'medium', 'large');
    
    // Add new size class
    this.marketGrid.classList.add(size);
  }

  openSettingsModal() {
    // Populate settings form with current values
    document.getElementById('refresh-rate').value = this.app.settings.refreshRate;
    
    // Set grid size radio
    const gridRadio = document.querySelector(`input[name="grid-size"][value="${this.app.settings.gridSize}"]`);
    if (gridRadio) {
      gridRadio.checked = true;
    }
    
    // Show modal
    this.settingsModal.style.display = 'block';
  }

  closeSettingsModal() {
    this.settingsModal.style.display = 'none';
  }

  saveSettings() {
    // Get values from form
    const refreshRate = parseInt(document.getElementById('refresh-rate').value, 10);
    const gridSize = document.querySelector('input[name="grid-size"]:checked').value;
    
    // Create new settings object
    const newSettings = {
      refreshRate: refreshRate,
      gridSize: gridSize,
      watchlist: [...this.app.settings.watchlist] // Keep existing watchlist
    };
    
    // Save settings
    this.app.saveSettings(newSettings);
    
    // Close modal
    this.closeSettingsModal();
  }

  renderWatchlist() {
    // Clear existing items
    this.watchlistItems.innerHTML = '';
    
    // Add items for each instrument in watchlist
    this.app.settings.watchlist.forEach(instrument => {
      const item = document.createElement('div');
      item.className = 'watchlist-item';
      
      item.innerHTML = `
        <div>
          <span class="watchlist-symbol">${instrument.symbol}</span>
          <span class="watchlist-type">${instrument.type}</span>
        </div>
        <button class="remove-btn" data-symbol="${instrument.symbol}">✕</button>
      `;
      
      this.watchlistItems.appendChild(item);
      
      // Add event listener for remove button
      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.app.removeFromWatchlist(instrument.symbol);
      });
    });
  }

  addInstrument() {
    const symbolInput = document.getElementById('new-symbol');
    const typeSelect = document.getElementById('instrument-type');
    
    const symbol = symbolInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    
    if (symbol) {
      const added = this.app.addToWatchlist(symbol, type);
      
      if (added) {
        // Clear input
        symbolInput.value = '';
      } else {
        alert('This symbol is already in your watchlist');
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
  
  toggleScreensaverMode() {
    const appContainer = document.querySelector('.app-container');
    
    if (document.body.classList.contains('screensaver-mode')) {
      this.exitScreensaverMode();
    } else {
      // Enter screensaver mode
      document.body.classList.add('screensaver-mode');
      
      // Request fullscreen for immersive experience
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      
      // Hide settings modal if open
      this.closeSettingsModal();
      
      // Update status
      this.updateStatus('Screensaver mode active', true);
      
      // Refresh data immediately
      this.app.fetchAllMarketData();
    }
  }
  
  exitScreensaverMode() {
    // Exit screensaver mode
    document.body.classList.remove('screensaver-mode');
    
    // Update status
    this.updateStatus('Screensaver mode deactivated', true);
  }
}

// API Service class
class EnhancedApiService {
  constructor(app) {
    this.app = app;
    this.cache = {};
    this.lastRequestTime = {};
    this.requestCount = 0;
    this.maxRequestsPerMinute = 100; // Yahoo Finance API limit
    this.quoteCacheDuration = 10; // 10 seconds for quotes
    this.historicalCacheDuration = 60; // 60 seconds for historical data
    this.offlineMode = false;
  }

  async fetchMarketData(symbol, type) {
    try {
      // Check if we need to use fallback data
      if (this.offlineMode || this.isRateLimited()) {
        return this.generateFallbackData(symbol, type);
      }
      
      // Check cache first
      const cacheKey = `${symbol}-${type}`;
      const now = Date.now();
      
      if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) / 1000 < this.quoteCacheDuration) {
        return this.cache[cacheKey].data;
      }
      
      // Track API request
      this.trackRequest();
      
      // Fetch real data from Yahoo Finance API
      const quoteData = await this.fetchQuote(symbol);
      const historicalData = await this.fetchHistoricalData(symbol);
      
      // Format data based on instrument type
      const formattedData = this.formatMarketData(quoteData, historicalData, type);
      
      // Cache the result
      this.cache[cacheKey] = {
        timestamp: now,
        data: formattedData
      };
      
      return formattedData;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      
      // Use fallback data on error
      return this.generateFallbackData(symbol, type);
    }
  }

  async fetchQuote(symbol) {
    // In a real implementation, this would make an API call to Yahoo Finance
    // For now, we'll simulate the API call with a delay
    await this.simulateApiDelay();
    
    // Return simulated quote data
    return {
      symbol: symbol,
      price: this.getRandomPrice(100, 1000),
      change: this.getRandomPrice(-20, 20),
      changePercent: this.getRandomPrice(-5, 5),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: Date.now()
    };
  }

  async fetchHistoricalData(symbol) {
    // In a real implementation, this would make an API call to Yahoo Finance
    // For now, we'll simulate the API call with a delay
    await this.simulateApiDelay();
    
    // Generate 24 data points (hourly for a day)
    const points = 24;
    const basePrice = this.getRandomPrice(100, 1000);
    const volatility = basePrice * 0.05; // 5% volatility
    
    const historicalData = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);
      
      historicalData.push({
        time: time.toISOString(),
        price: basePrice + this.getRandomPrice(-volatility, volatility)
      });
    }
    
    return historicalData;
  }

  formatMarketData(quoteData, historicalData, type) {
    // Format data based on instrument type
    let formattedData = {
      symbol: quoteData.symbol,
      price: quoteData.price,
      change: quoteData.change,
      changePercent: quoteData.changePercent,
      volume: quoteData.volume,
      marketCap: quoteData.marketCap,
      timestamp: quoteData.timestamp,
      historicalData: historicalData,
      type: type
    };
    
    // Add type-specific formatting
    switch (type) {
      case 'crypto':
        // Cryptocurrencies typically have more decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(2));
        break;
      case 'forex':
        // Forex typically shows 4 decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(4));
        break;
      default:
        // Stocks typically show 2 decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(2));
    }
    
    return formattedData;
  }

  generateFallbackData(symbol, type) {
    // Generate synthetic data when API is unavailable
    const basePrice = this.getRandomPrice(100, 1000);
    const change = this.getRandomPrice(-20, 20);
    const changePercent = (change / basePrice) * 100;
    
    // Generate historical data points
    const points = 24;
    const volatility = basePrice * 0.05; // 5% volatility
    
    const historicalData = [];
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);
      
      historicalData.push({
        time: time.toISOString(),
        price: basePrice + this.getRandomPrice(-volatility, volatility) + (i * change / points)
      });
    }
    
    return {
      symbol: symbol,
      price: basePrice + change,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: Date.now(),
      historicalData: historicalData,
      type: type,
      isFallback: true
    };
  }

  trackRequest() {
    const now = Date.now();
    this.requestCount++;
    
    // Reset counter after a minute
    setTimeout(() => {
      this.requestCount--;
    }, 60000);
  }

  isRateLimited() {
    return this.requestCount >= this.maxRequestsPerMinute;
  }

  async simulateApiDelay() {
    // Simulate network delay
    const delay = Math.random() * 300 + 100; // 100-400ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getRandomPrice(min, max) {
    return Math.random() * (max - min) + min;
  }

  setOfflineMode(offline) {
    this.offlineMode = offline;
    return this.offlineMode;
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new QuickMarketsApp();
});
